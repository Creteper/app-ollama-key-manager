import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listApiKeys } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const CreateKeySchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['claude', 'openai']),
});

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const keys = await listApiKeys();
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error listing keys:', error);
    return NextResponse.json(
      { error: 'Failed to list keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const validation = CreateKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, provider } = validation.data;
    const apiKey = await createApiKey(name, provider);

    return NextResponse.json({
      success: true,
      key: apiKey,
      message: 'API key created successfully. Save this key - it will not be shown again!',
    });
  } catch (error) {
    console.error('Error creating key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create key', details: errorMessage },
      { status: 500 }
    );
  }
}
