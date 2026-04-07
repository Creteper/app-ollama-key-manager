# Ollama API Usage Examples with cURL

This document contains example cURL commands for using the Ollama Key Manager proxy.

## Prerequisites

- Server running at `http://localhost:3000`
- Ollama server running and configured
- Valid API key created through the web interface

## Management API Examples

### 1. List All API Keys

```bash
curl http://localhost:3000/api/keys
```

**Response:**
```json
{
  "keys": [
    {
      "id": "abc123",
      "name": "Production App",
      "key_hash": "a1b2c3...",
      "provider": "claude",
      "created_at": 1704067200000,
      "last_used_at": 1704153600000,
      "usage_count": 42
    }
  ]
}
```

### 2. Create a New API Key

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App Key",
    "provider": "claude"
  }'
```

**Response:**
```json
{
  "success": true,
  "key": {
    "id": "abc123",
    "name": "My App Key",
    "key": "sk-xxxxxxxxxxx",
    "key_hash": "a1b2c3...",
    "provider": "claude",
    "created_at": 1704067200000,
    "last_used_at": null,
    "usage_count": 0
  },
  "message": "API key created successfully. Save this key - it will not be shown again!"
}
```

⚠️ **Important**: Save the `key` value immediately - it will never be shown again!

### 3. Delete a Key

```bash
curl -X DELETE http://localhost:3000/api/keys/abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Key deleted successfully"
}
```

## Ollama Proxy API Examples

All examples use `YOUR_API_KEY` - replace with your actual API key.

### Authentication Methods

You can authenticate using either:

**Bearer Token (Recommended):**
```bash
-H "Authorization: Bearer YOUR_API_KEY"
```

**X-API-Key Header:**
```bash
-H "X-API-Key: YOUR_API_KEY"
```

### Chat Completion

```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
  }'
```

**Response:**
```json
{
  "model": "llama2",
  "created_at": "2024-01-01T00:00:00.000000Z",
  "message": {
    "role": "assistant",
    "content": "The capital of France is Paris."
  },
  "done": true
}
```

### Chat Completion with Streaming

```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Tell me a short story."}
    ],
    "stream": true
  }'
```

### Generate Completion

```bash
curl http://localhost:3000/api/proxy/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "Why is the sky blue?"
  }'
```

### Generate Completion with Streaming

```bash
curl http://localhost:3000/api/proxy/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "Explain quantum computing in simple terms.",
    "stream": true
  }'
```

### List Available Models

```bash
curl http://localhost:3000/api/proxy/api/tags \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "modified_at": "2024-01-01T00:00:00.000000Z",
      "size": 3826793677,
      "digest": "sha256:...",
      "details": {
        "format": "gguf",
        "family": "llama",
        "families": ["llama"],
        "parameter_size": "7B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```

### Show Model Information

```bash
curl http://localhost:3000/api/proxy/api/show \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "llama2"
  }'
```

### Pull a Model

```bash
curl http://localhost:3000/api/proxy/api/pull \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "llama2",
    "stream": true
  }'
```

### Generate Embeddings

```bash
curl http://localhost:3000/api/proxy/api/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "Hello, world!"
  }'
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...]
}
```

### Copy a Model

```bash
curl http://localhost:3000/api/proxy/api/copy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "source": "llama2",
    "destination": "llama2-custom"
  }'
```

### Delete a Model

```bash
curl -X DELETE http://localhost:3000/api/proxy/api/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "name": "llama2-custom"
  }'
```

## Advanced Examples

### Chat with Temperature and Top-P

```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Write a creative poem about coding."}
    ],
    "options": {
      "temperature": 0.8,
      "top_p": 0.9
    }
  }'
```

### Multi-turn Conversation

```bash
curl http://localhost:3000/api/proxy/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "What is 2+2?"},
      {"role": "assistant", "content": "2+2 equals 4."},
      {"role": "user", "content": "What about 3+3?"}
    ]
  }'
```

### Generate with System Prompt

```bash
curl http://localhost:3000/api/proxy/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "llama2",
    "prompt": "Write a haiku about programming",
    "system": "You are a creative poet who specializes in technical topics."
  }'
```

## Using with Programming Languages

### Python

```python
import requests

BASE_URL = "http://localhost:3000"
API_KEY = "your-api-key-here"

# Chat completion
response = requests.post(
    f"{BASE_URL}/api/proxy/api/chat",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "llama2",
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
print(response.json())

# List models
response = requests.get(
    f"{BASE_URL}/api/proxy/api/tags",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
print(response.json())
```

### JavaScript/Node.js

```javascript
const BASE_URL = "http://localhost:3000";
const API_KEY = "your-api-key-here";

// Chat completion
const chatCompletion = async () => {
  const response = await fetch(`${BASE_URL}/api/proxy/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "llama2",
      messages: [{ role: "user", content: "Hello!" }]
    })
  });
  return response.json();
};

// List models
const listModels = async () => {
  const response = await fetch(`${BASE_URL}/api/proxy/api/tags`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  return response.json();
};
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const (
    baseURL = "http://localhost:3000"
    apiKey  = "your-api-key-here"
)

func chatCompletion() {
    payload := map[string]interface{}{
        "model": "llama2",
        "messages": []map[string]string{
            {"role": "user", "content": "Hello!"},
        },
    }

    jsonData, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", baseURL+"/api/proxy/api/chat", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+apiKey)

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}
```

## Error Responses

### Missing API Key

```bash
curl http://localhost:3000/api/proxy/api/tags
```

**Response (401):**
```json
{
  "error": "Missing API key",
  "message": "Please provide an API key via Authorization header (Bearer token) or X-API-Key header"
}
```

### Invalid API Key

```bash
curl http://localhost:3000/api/proxy/api/tags \
  -H "Authorization: Bearer invalid-key"
```

**Response (401):**
```json
{
  "error": "Invalid API key"
}
```

### Ollama Server Unavailable

**Response (502):**
```json
{
  "error": "Failed to connect to Ollama server",
  "details": "connect ECONNREFUSED 127.0.0.1:11434"
}
```

## Tips

1. **Save your API keys**: They are only shown once during creation
2. **Use environment variables**: Store API keys in environment variables, not in code
3. **Monitor usage**: Check the web interface to track API usage
4. **Streaming**: Add `"stream": true` for real-time responses
5. **Error handling**: Always check response status codes

## jq for Better JSON Formatting

Pipe cURL output through `jq` for pretty formatting:

```bash
curl http://localhost:3000/api/proxy/api/tags \
  -H "Authorization: Bearer YOUR_API_KEY" | jq
```
