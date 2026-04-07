# Ollama API Key Manager

A powerful API key management system with proxy functionality for Ollama. This project allows you to create, manage, and track API keys that control access to your Ollama server.

## Features

- **API Key Management**: Create, delete, and list API keys with custom names
- **Ollama Proxy**: Transparent proxy for all Ollama API endpoints
- **Flexible Authentication**: Support for both Bearer token and X-API-Key headers
- **Usage Tracking**: Track usage count and last used timestamp for each key
- **Secure Storage**: Keys are hashed using SHA-256 before storage
- **Streaming Support**: Full support for streaming responses
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Prerequisites

- Docker and Docker Compose (for Docker deployment)
- OR Node.js 20+ and pnpm (for local development)

## Quick Start with Docker

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd app-ollama-key-manager
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and configure your Ollama server:
   ```env
   OLLAMA_API_URL=http://localhost:11434
   ```

4. Start the services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Access the web interface at `http://localhost:3000`

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file and configure your Ollama server (see Quick Start step 2-3)

3. Create the data directory:
   ```bash
   mkdir -p data
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating an API Key

1. Open the web interface
2. Click "Create New API Key"
3. Enter a name for your key (e.g., "Production App")
4. Select the provider type (for organizational purposes)
5. Click "Create"
6. **Important**: Save the generated key immediately - it will only be shown once!

### Using an API Key

Replace your Ollama base URL with the proxy URL and add authentication:

**Chat Completion:**
```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GENERATED_KEY" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**List Models:**
```bash
curl http://localhost:3000/api/proxy/api/tags \
  -H "Authorization: Bearer YOUR_GENERATED_KEY"
```

**Generate Completion (Streaming):**
```bash
curl http://localhost:3000/api/proxy/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GENERATED_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "Why is the sky blue?",
    "stream": true
  }'
```

### Deleting an API Key

1. Find the key in the table
2. Click the "Delete" button
3. Confirm the deletion

## API Endpoints

### Management API

- `GET /api/keys` - List all API keys
- `POST /api/keys` - Create a new API key
- `GET /api/keys/[id]` - Get a specific key
- `DELETE /api/keys/[id]` - Delete a key

### Proxy API (All Ollama Endpoints)

- `ALL /api/proxy/**` - Proxy all Ollama API requests
  - `/api/proxy/api/chat` - Chat completion
  - `/api/proxy/api/generate` - Text generation
  - `/api/proxy/api/tags` - List models
  - `/api/proxy/api/show` - Show model info
  - `/api/proxy/api/pull` - Pull a model
  - `/api/proxy/api/push` - Push a model
  - `/api/proxy/api/embeddings` - Generate embeddings
  - And all other Ollama endpoints...

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PATH` | Path to SQLite database file | No (default: `./data/keys.db`) |
| `OLLAMA_API_URL` | Ollama server URL | No (default: `http://localhost:11434`) |
| `ADMIN_PASSWORD` | Admin password for future features | No |

### Docker Compose Configuration

The `docker-compose.yml` includes:
- **ollama-key-manager**: The key management service
- **ollama** (optional): Ollama service for local LLM deployment

To exclude the Ollama service, comment it out in `docker-compose.yml`.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ Authorization: Bearer YOUR_KEY
       │ /api/proxy/api/chat
       │
       ▼
┌─────────────────────────────┐
│  Ollama Key Manager (Next.js) │
├─────────────────────────────┤
│  • Validate API Key         │
│  • Track Usage              │
│  • Forward Request          │
└──────┬──────────────────────┘
       │
       │ /api/chat
       │
       ▼
┌─────────────────────────────┐
│     Ollama Server           │
│   (Local or Remote)         │
└─────────────────────────────┘
```

## Database Schema

The SQLite database contains a single table:

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK(provider IN ('claude', 'openai')),
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  usage_count INTEGER DEFAULT 0
);
```

## Security Considerations

1. **Key Storage**: API keys are hashed with SHA-256 before storage
2. **HTTPS**: Use HTTPS in production to protect keys in transit
3. **Environment Variables**: Never commit `.env` files with real API keys
4. **Access Control**: Consider adding authentication to the management interface in production
5. **Rate Limiting**: Consider implementing rate limiting for production use

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
