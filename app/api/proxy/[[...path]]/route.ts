import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/db';

// Ollama 服务器地址，从环境变量读取
const OLLAMA_BASE_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

/**
 * 从请求头中提取 API Key
 */
function extractApiKey(request: NextRequest): string | null {
  // 支持多种认证方式
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 也支持 X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * 转发请求到 Ollama API
 */
async function forwardToOllama(request: NextRequest, path: string[]) {
  // 构建目标 URL
  let targetPath = path.join('/');

  // 如果路径不以 'api/' 开头，自动添加
  // 这样支持 /api/proxy/tags 和 /api/proxy/api/tags 两种格式
  if (!targetPath.startsWith('api/')) {
    targetPath = 'api/' + targetPath;
  }

  const targetUrl = `${OLLAMA_BASE_URL}/${targetPath}`;

  // 获取查询参数
  const searchParams = new URL(request.url).searchParams;
  const queryString = searchParams.toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  // 准备请求头（移除认证相关的头，因为 Ollama 本身不需要）
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // 排除认证头和 host 头
    if (
      lowerKey !== 'authorization' &&
      lowerKey !== 'x-api-key' &&
      lowerKey !== 'host' &&
      lowerKey !== 'connection'
    ) {
      headers.set(key, value);
    }
  });

  // 读取请求体
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData() as any;
      } else {
        body = await request.text();
      }
    } catch (error) {
      console.error('Error reading request body:', error);
    }
  }

  try {
    // 转发请求到 Ollama
    const response = await fetch(fullUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    // 处理流式响应（如 /api/generate, /api/chat 等）
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/x-ndjson') ||
        contentType?.includes('text/event-stream') ||
        response.headers.get('transfer-encoding') === 'chunked') {
      // 流式响应
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': contentType || 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 非流式响应
    const responseData = await response.text();

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType || 'application/json',
      },
    });

  } catch (error) {
    console.error('Error forwarding to Ollama:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to Ollama server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

/**
 * 处理所有 HTTP 方法
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    // 提取并验证 API Key
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing API key',
          message: 'Please provide an API key via Authorization header (Bearer token) or X-API-Key header'
        },
        { status: 401 }
      );
    }

    const validation = await validateApiKey(apiKey);

    if (!validation.valid || !validation.keyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // 获取路径参数
    const { path = [] } = await params;

    // 转发请求到 Ollama
    return await forwardToOllama(request, path);

  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 导出所有 HTTP 方法
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const HEAD = handleRequest;
export const OPTIONS = handleRequest;
