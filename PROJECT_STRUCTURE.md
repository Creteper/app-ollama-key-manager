# Project Structure

## Overview

This is an Ollama API Key Manager built with Next.js 16, featuring API key management for Claude and OpenAI with an Ollama-compatible interface.

## Directory Structure

```
app-ollama-key-manager/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── keys/                 # Key management endpoints
│   │   │   ├── route.ts          # GET (list) and POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET (retrieve) and DELETE
│   │   └── v1/
│   │       └── chat/
│   │           └── completions/
│   │               └── route.ts  # Ollama-compatible chat endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main dashboard UI
│   └── globals.css               # Global styles
├── lib/
│   └── db.ts                     # Database operations (SQLite)
├── data/                         # SQLite database storage (gitignored)
├── scripts/                      # Setup scripts
│   ├── setup.sh                  # Linux/Mac setup
│   └── setup.bat                 # Windows setup
├── Dockerfile                    # Docker image configuration
├── docker-compose.yml            # Docker Compose setup
├── .env.example                  # Environment variables template
└── package.json                  # Dependencies and scripts
```

## Key Files

### Database Layer (`lib/db.ts`)

Handles all database operations:
- `createApiKey()` - Generate and store new API key
- `listApiKeys()` - Retrieve all keys
- `deleteApiKey()` - Remove a key
- `validateApiKey()` - Authenticate requests
- `getApiKeyById()` - Get specific key details

Uses SQLite with better-sqlite3 for simplicity and performance.

### API Routes

**Key Management (`/api/keys`)**
- Manage API keys (CRUD operations)
- No authentication (add in production!)

**Chat Completions (`/api/v1/chat/completions`)**
- Ollama-compatible endpoint
- Validates API key
- Forwards to Claude or OpenAI based on key's provider
- Auto-converts request/response formats

### Frontend (`app/page.tsx`)

Single-page React application:
- List all API keys in a table
- Create new keys with modal dialog
- Delete keys with confirmation
- Display usage statistics
- Show usage instructions

### Docker Configuration

**Dockerfile**
- Multi-stage build for optimization
- Includes native dependencies (better-sqlite3)
- Standalone output mode

**docker-compose.yml**
- Main application service
- Optional Ollama container
- Volume for persistent database
- Network configuration

## Data Flow

### Creating an API Key

1. User clicks "Create New API Key" in UI
2. Frontend sends POST to `/api/keys`
3. Server generates secure random key
4. Key is hashed with SHA-256
5. Stored in SQLite database
6. Full key returned ONCE to user
7. UI displays key with copy button

### Using an API Key

1. Client sends request to `/api/v1/chat/completions`
2. Server extracts Bearer token
3. Token hashed and validated against database
4. Usage count incremented
5. Request forwarded to Claude/OpenAI
6. Response converted to OpenAI format (if needed)
7. Returned to client

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS 4
- **Validation**: Zod
- **ID Generation**: nanoid
- **Containerization**: Docker

## Security Features

1. **Key Hashing**: SHA-256 hash stored, not plaintext
2. **Secure Generation**: Cryptographically secure random keys
3. **Usage Tracking**: Monitor key usage
4. **Provider Isolation**: Keys tied to specific provider

## Environment Variables

- `DATABASE_PATH` - SQLite database location
- `CLAUDE_API_KEY` - Your Claude API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `ADMIN_PASSWORD` - Reserved for future auth

## API Endpoints

### Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | List all keys |
| POST | `/api/keys` | Create new key |
| GET | `/api/keys/[id]` | Get key details |
| DELETE | `/api/keys/[id]` | Delete key |

### Proxy API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/completions` | Chat completions (OpenAI format) |

## Development Workflow

1. Run `pnpm install` to install dependencies
2. Create `.env` from `.env.example`
3. Add your API keys to `.env`
4. Run `pnpm dev` for development server
5. Access UI at `http://localhost:3000`

## Production Deployment

### With Docker

```bash
docker-compose up -d
```

### Manual

```bash
pnpm install
pnpm build
pnpm start
```

## Future Enhancements

- [ ] Add authentication for management UI
- [ ] Implement rate limiting per key
- [ ] Add API key expiration
- [ ] Support more providers (Gemini, etc.)
- [ ] Add analytics dashboard
- [ ] Implement key rotation
- [ ] Add webhook notifications
- [ ] Support for streaming responses with format conversion
