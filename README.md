# Ollama API Key Manager

一个功能强大的 API 密钥管理系统，为 Ollama 提供代理和认证功能。此项目允许您创建、管理和跟踪控制访问 Ollama 服务器的 API 密钥，并提供完整的管理员认证系统。

## ✨ 功能特性

- **🔐 管理员认证**: 基于 NextAuth.js 的完整身份验证系统
- **🔑 API 密钥管理**: 创建、删除和列出带有自定义名称的 API 密钥
- **🔄 Ollama 代理**: 透明代理所有 Ollama API 端点
- **🛡️ 灵活认证**: 支持 Bearer token 和 X-API-Key 两种请求头
- **📊 使用追踪**: 跟踪每个密钥的使用次数和最后使用时间
- **🔒 安全存储**: 密钥使用 SHA-256 哈希后存储在 MySQL 数据库
- **⚡ 流式支持**: 完整支持流式响应
- **🐳 Docker 支持**: 使用 Docker 和 Docker Compose 轻松部署
- **💾 MySQL 存储**: 使用 MySQL 8.0 数据库确保数据可靠性和扩展性
- **🎨 现代化 UI**: 使用 Next.js 和 Tailwind CSS 构建的清爽响应式界面
- **🌙 深色模式**: 支持亮色/暗色主题

## 📋 前置要求

- Docker 和 Docker Compose (Docker 部署方式) - 推荐
- 或 Node.js 20+ 和 pnpm + MySQL 8.0+ (本地开发方式)
- Ollama 服务器 (本地或远程)

## 🚀 快速开始

### 方式 1: Docker 部署 (推荐)

1. **克隆仓库**
   ```bash
   git clone <your-repo-url>
   cd app-ollama-key-manager
   ```

2. **创建配置文件**
   ```bash
   cp .env.example .env
   ```

3. **编辑 `.env` 文件并配置必要参数**
   ```env
   # MySQL 数据库配置
   MYSQL_HOST=mysql
   MYSQL_PORT=3306
   MYSQL_USER=ollama_user
   MYSQL_PASSWORD=ollama_password
   MYSQL_DATABASE=ollama_keys
   MYSQL_ROOT_PASSWORD=root_password

   # Ollama 服务器地址
   OLLAMA_API_URL=http://localhost:11434

   # 管理员认证配置
   ADMIN_PASSWORD=your_secure_password_here

   # NextAuth 配置 (使用 openssl rand -base64 32 生成)
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **生成安全密钥**
   ```bash
   # 生成 NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

5. **启动服务**
   ```bash
   docker-compose up -d
   ```

6. **访问管理界面**

   打开浏览器访问 `http://localhost:3000`，使用您在 `.env` 中设置的 `ADMIN_PASSWORD` 登录。

### 方式 2: 本地开发

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **创建并配置 `.env` 文件**（参考上面的 Docker 部署步骤 2-4）

3. **创建数据目录**
   ```bash
   mkdir -p data
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **访问应用**

   在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 方式 3: 生产构建

1. **构建项目**
   ```bash
   pnpm build
   ```

2. **启动生产服务器**
   ```bash
   pnpm start
   ```

## 📖 使用指南

### 第一步: 管理员登录

1. 访问 `http://localhost:3000`
2. 系统会自动重定向到登录页面
3. 输入您在 `.env` 文件中配置的 `ADMIN_PASSWORD`
4. 点击 "Sign In" 登录

### 第二步: 创建 API 密钥

1. 登录后进入管理界面
2. 点击 "Create New API Key" 按钮
3. 输入密钥名称（例如: "生产环境"、"测试应用"）
4. 选择提供商类型（用于组织分类）
   - **claude**: 用于 Claude 类模型
   - **openai**: 用于 OpenAI 类模型
5. 点击 "Create" 创建
6. **⚠️ 重要**: 立即保存生成的密钥 - 它只会显示一次!

### 第三步: 使用 API 密钥

将您的 Ollama 基础 URL 替换为代理 URL，并添加认证信息:

#### 示例 1: 聊天补全
```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GENERATED_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "你好!"}
    ]
  }'
```

#### 示例 2: 列出可用模型
```bash
curl http://localhost:3000/api/proxy/api/tags \
  -H "Authorization: Bearer YOUR_GENERATED_KEY"
```

或者使用简化路径:
```bash
curl http://localhost:3000/api/proxy/tags \
  -H "Authorization: Bearer YOUR_GENERATED_KEY"
```

#### 示例 3: 文本生成（流式）
```bash
curl http://localhost:3000/api/proxy/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GENERATED_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "为什么天空是蓝色的?",
    "stream": true
  }'
```

#### 示例 4: 使用 X-API-Key 请求头
```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_GENERATED_KEY" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 在代码中使用

#### Python 示例
```python
import requests

API_BASE = "http://localhost:3000/api/proxy"
API_KEY = "your_generated_key_here"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 聊天补全
response = requests.post(
    f"{API_BASE}/api/chat",
    headers=headers,
    json={
        "model": "llama2",
        "messages": [
            {"role": "user", "content": "Hello!"}
        ]
    }
)

print(response.json())
```

#### JavaScript/Node.js 示例
```javascript
const API_BASE = "http://localhost:3000/api/proxy";
const API_KEY = "your_generated_key_here";

const response = await fetch(`${API_BASE}/api/chat`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "llama2",
    messages: [
      { role: "user", content: "Hello!" }
    ]
  })
});

const data = await response.json();
console.log(data);
```

### 管理 API 密钥

#### 查看密钥信息
在管理界面的表格中，您可以看到:
- 密钥名称
- 提供商类型
- 使用次数
- 最后使用时间
- 创建时间
- 密钥哈希值（前 16 位）

#### 删除密钥
1. 在表格中找到要删除的密钥
2. 点击右侧的 "Delete" 按钮
3. 确认删除操作

#### 登出
点击页面右上角的 "Sign Out" 按钮安全登出

## 🔌 API 端点说明

### 认证 API

| 端点 | 方法 | 描述 | 认证要求 |
|------|------|------|----------|
| `/api/auth/signin` | POST | 管理员登录 | 无 |
| `/api/auth/signout` | POST | 管理员登出 | Session |
| `/api/auth/session` | GET | 获取当前会话 | Session |

### 管理 API

| 端点 | 方法 | 描述 | 认证要求 |
|------|------|------|----------|
| `/api/keys` | GET | 列出所有 API 密钥 | Admin Session |
| `/api/keys` | POST | 创建新的 API 密钥 | Admin Session |
| `/api/keys/[id]` | GET | 获取指定密钥信息 | Admin Session |
| `/api/keys/[id]` | DELETE | 删除指定密钥 | Admin Session |

#### 创建密钥请求示例
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "我的应用密钥",
    "provider": "claude"
  }'
```

响应:
```json
{
  "success": true,
  "key": {
    "id": "abc123",
    "name": "我的应用密钥",
    "key": "sk-xxxxxxxxxxxxxxxxxxxx",
    "key_hash": "hash_value",
    "provider": "claude",
    "created_at": 1234567890,
    "last_used_at": null,
    "usage_count": 0
  },
  "message": "API key created successfully. Save this key - it will not be shown again!"
}
```

### 代理 API (支持所有 Ollama 端点)

| 端点 | 方法 | 描述 | 认证要求 |
|------|------|------|----------|
| `/api/proxy/**` | ALL | 代理所有 Ollama API 请求 | API Key |

#### 支持的 Ollama 端点

1. **聊天补全**
   - `POST /api/proxy/api/chat` 或 `/api/proxy/chat`

2. **文本生成**
   - `POST /api/proxy/api/generate` 或 `/api/proxy/generate`

3. **模型管理**
   - `GET /api/proxy/api/tags` 或 `/api/proxy/tags` - 列出模型
   - `POST /api/proxy/api/show` 或 `/api/proxy/show` - 显示模型信息
   - `POST /api/proxy/api/pull` 或 `/api/proxy/pull` - 拉取模型
   - `POST /api/proxy/api/push` 或 `/api/proxy/push` - 推送模型
   - `DELETE /api/proxy/api/delete` 或 `/api/proxy/delete` - 删除模型

4. **向量嵌入**
   - `POST /api/proxy/api/embeddings` 或 `/api/proxy/embeddings`

5. **其他端点**
   - 支持所有其他 Ollama API 端点

## ⚙️ 配置说明

### 环境变量

| 变量名 | 描述 | 必需 | 默认值 |
|--------|------|------|--------|
| `DATABASE_PATH` | SQLite 数据库文件路径 | 否 | `./data/keys.db` |
| `OLLAMA_API_URL` | Ollama 服务器地址 | 否 | `http://localhost:11434` |
| `ADMIN_PASSWORD` | 管理员登录密码 | **是** | 无 |
| `NEXTAUTH_SECRET` | NextAuth.js 加密密钥 | **是** | 无 |
| `NEXTAUTH_URL` | 应用程序完整 URL | **是** | `http://localhost:3000` |

### 生成安全密钥

```bash
# 生成 NEXTAUTH_SECRET (32 字节随机字符串)
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Docker Compose 配置

`docker-compose.yml` 包含两个服务:

1. **ollama-key-manager** (必需)
   - 密钥管理和代理服务
   - 端口: 3000
   - 数据持久化: `./data` 目录

2. **ollama** (可选)
   - Ollama 本地服务
   - 端口: 11434
   - 如果使用远程 Ollama 服务器，可以在 `docker-compose.yml` 中注释掉此服务

### 自定义端口

如果需要使用不同的端口，修改 `docker-compose.yml`:

```yaml
services:
  ollama-key-manager:
    ports:
      - "8080:3000"  # 将 3000 改为 8080
    environment:
      - NEXTAUTH_URL=http://localhost:8080  # 同步修改 URL
```

## 🏗️ 系统架构

### 架构图

```
┌──────────────────┐
│  管理员浏览器      │
└────────┬─────────┘
         │ Admin Password
         │ /login
         ▼
┌─────────────────────────────────────┐
│   Web 管理界面 (NextAuth.js)          │
│   • 管理员认证                        │
│   • 创建/删除 API 密钥                 │
│   • 查看使用统计                      │
└─────────────────────────────────────┘
         │
         │ Session Protected
         ▼
┌─────────────────────────────────────┐
│   管理 API (/api/keys)               │
│   • requireAuth() 中间件              │
│   • CRUD 操作                        │
└─────────────────────────────────────┘


┌──────────────────┐
│  应用客户端        │ (Python, Node.js, curl...)
└────────┬─────────┘
         │ Authorization: Bearer API_KEY
         │ /api/proxy/**
         ▼
┌─────────────────────────────────────┐
│   代理 API (/api/proxy/**)           │
├─────────────────────────────────────┤
│   • 验证 API Key                     │
│   • 更新使用统计                      │
│   • 转发请求到 Ollama                 │
└────────┬────────────────────────────┘
         │
         │ /api/chat, /api/generate...
         ▼
┌─────────────────────────────────────┐
│   Ollama 服务器                      │
│   (本地或远程)                        │
└─────────────────────────────────────┘
```

### 认证层级

1. **管理员认证** (NextAuth.js + Session)
   - 保护管理界面和管理 API
   - 基于密码的认证
   - Session 持续 30 天

2. **API 密钥认证** (自定义验证)
   - 保护代理 API
   - Bearer Token 或 X-API-Key
   - 密钥哈希存储 (SHA-256)

## 🗄️ 数据库架构

SQLite 数据库包含一个表:

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,              -- 唯一标识符 (nanoid)
  name TEXT NOT NULL,               -- 密钥名称
  key_hash TEXT NOT NULL UNIQUE,    -- SHA-256 哈希值
  provider TEXT NOT NULL            -- 提供商: 'claude' | 'openai'
    CHECK(provider IN ('claude', 'openai')),
  created_at INTEGER NOT NULL,      -- 创建时间戳 (毫秒)
  last_used_at INTEGER,             -- 最后使用时间戳
  usage_count INTEGER DEFAULT 0     -- 使用次数
);

-- 索引
CREATE INDEX idx_key_hash ON api_keys(key_hash);
CREATE INDEX idx_provider ON api_keys(provider);
```

### 数据存储位置

- 默认路径: `./data/keys.db`
- Docker 挂载: 主机 `./data` → 容器 `/app/data`
- 支持通过 `DATABASE_PATH` 环境变量自定义

## 🔐 安全建议

### 生产环境部署

1. **使用 HTTPS**
   ```bash
   # 使用 Nginx 反向代理
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **强密码策略**
   - `ADMIN_PASSWORD`: 至少 16 位，包含大小写字母、数字和特殊字符
   - 定期更换管理员密码
   - 使用密码管理器存储

3. **NEXTAUTH_SECRET 安全**
   - 必须使用 32 字节以上的随机字符串
   - 绝不在代码中硬编码
   - 生产环境与开发环境使用不同的密钥

4. **API 密钥管理**
   - API 密钥以 SHA-256 哈希存储，原始密钥不保存
   - 定期审查和轮换密钥
   - 为不同环境/应用创建独立密钥
   - 及时删除不再使用的密钥

5. **环境变量保护**
   - 绝不提交 `.env` 文件到 Git
   - 使用 `.env.example` 作为模板
   - 生产环境使用密钥管理服务 (AWS Secrets Manager, HashiCorp Vault)

6. **网络隔离**
   ```yaml
   # docker-compose.yml - 内部网络隔离
   services:
     ollama-key-manager:
       networks:
         - frontend
         - backend

     ollama:
       networks:
         - backend  # Ollama 只在内部网络

   networks:
     frontend:
       driver: bridge
     backend:
       internal: true  # 内部网络，外部无法访问
   ```

7. **访问日志和监控**
   - 记录所有 API 调用
   - 监控异常使用模式
   - 设置使用阈值告警

8. **限流保护**（建议实现）
   - 按 IP 限流
   - 按 API Key 限流
   - 使用 Redis 进行分布式限流

### 安全检查清单

- [ ] 更改默认的 `ADMIN_PASSWORD`
- [ ] 生成强随机的 `NEXTAUTH_SECRET`
- [ ] 配置 HTTPS (生产环境)
- [ ] 设置防火墙规则，仅开放必要端口
- [ ] 配置 CORS (如需跨域访问)
- [ ] 定期备份数据库
- [ ] 设置日志轮转
- [ ] 监控磁盘空间使用
- [ ] 定期更新依赖包

## Troubleshooting

### Database Permission Issues

If you see database permission errors:
```bash
chmod -R 777 data/
```

### Better-sqlite3 Build Issues

If you encounter build errors with `better-sqlite3`:
```bash
pnpm rebuild better-sqlite3
```

### Docker Build Issues

Make sure Docker has enough resources allocated:
- Memory: At least 2GB
- Disk: At least 5GB free space

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
