#!/bin/bash

# Test script for Ollama Key Manager API
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000"
API_KEY=""

echo "🧪 Testing Ollama Key Manager API"
echo "=================================="
echo ""

# Test 1: List existing keys
echo "1️⃣  Testing GET /api/keys (List all keys)"
echo "Request: GET $BASE_URL/api/keys"
curl -s "$BASE_URL/api/keys" | json_pp
echo ""
echo ""

# Test 2: Create a new key
echo "2️⃣  Testing POST /api/keys (Create new key)"
echo "Request: POST $BASE_URL/api/keys"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/keys" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Claude Key",
    "provider": "claude"
  }')

echo "$RESPONSE" | json_pp
echo ""

# Extract the API key from response
API_KEY=$(echo "$RESPONSE" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)

if [ -n "$API_KEY" ]; then
    echo "✅ Created API Key: $API_KEY"
    echo ""
    echo ""

    # Test 3: Use the key for chat completion
    echo "3️⃣  Testing POST /api/v1/chat/completions (Chat with created key)"
    echo "Request: POST $BASE_URL/api/v1/chat/completions"
    curl -s -X POST "$BASE_URL/api/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d '{
        "model": "claude-3-5-sonnet-20241022",
        "messages": [
          {"role": "user", "content": "Say hello in one sentence!"}
        ],
        "max_tokens": 100
      }' | json_pp
    echo ""
    echo ""

    # Test 4: List keys again to see updated usage
    echo "4️⃣  Testing GET /api/keys (Check updated usage)"
    echo "Request: GET $BASE_URL/api/keys"
    curl -s "$BASE_URL/api/keys" | json_pp
    echo ""
else
    echo "❌ Failed to create API key"
fi

echo ""
echo "✅ Tests complete!"
echo ""
echo "💡 Tip: You can delete the test key from the web UI at $BASE_URL"
