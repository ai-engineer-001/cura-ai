#!/usr/bin/env bash

# Cura AI Backend - Smoke Tests
# Tests all core API endpoints

set -e

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════╗"
echo "║       Cura AI Backend - Smoke Test Suite             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo -e "${YELLOW}🔍 Checking if server is running...${NC}"
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo -e "   Start server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi
echo ""

# Test 2: Embed Batch (with mock mode)
echo -e "${YELLOW}Test 2: Embed Batch${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/embed/batch" \
    -H "Content-Type: application/json" \
    -d '{
        "items": [
            {
                "id": "test-doc-1",
                "text": "If someone is not breathing, start CPR immediately. Call 911."
            },
            {
                "id": "test-doc-2",
                "text": "For choking, perform the Heimlich maneuver with quick upward abdominal thrusts."
            }
        ]
    }')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Embed batch passed${NC}"
else
    echo -e "${YELLOW}⚠️  Embed batch may require MOCK_MODE=true in .env${NC}"
fi
echo ""

# Test 3: Search/RAG Query (Normal)
echo -e "${YELLOW}Test 3: RAG Query (Normal)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/search" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "How do I treat a minor cut?",
        "sessionId": "smoke-test-session"
    }')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Normal RAG query passed${NC}"
else
    echo -e "${YELLOW}⚠️  RAG query may require Pinecone setup${NC}"
fi
echo ""

# Test 4: Emergency Detection
echo -e "${YELLOW}Test 4: RAG Query (Emergency)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/search" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "My friend collapsed and is not breathing! What do I do?",
        "sessionId": "emergency-test-session"
    }')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.emergency == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Emergency detection passed${NC}"
else
    echo -e "${YELLOW}⚠️  Emergency detection may not be working${NC}"
fi
echo ""

# Test 5: Real-time Session Start
echo -e "${YELLOW}Test 5: Real-time Session Start${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/realtime/start" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionId": "rt-smoke-test",
        "language": "en"
    }')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Real-time session start passed${NC}"
else
    echo -e "${RED}❌ Real-time session start failed${NC}"
fi
echo ""

# Test 6: Real-time Session Stop
echo -e "${YELLOW}Test 6: Real-time Session Stop${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/realtime/stop" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionId": "rt-smoke-test"
    }')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Real-time session stop passed${NC}"
else
    echo -e "${RED}❌ Real-time session stop failed${NC}"
fi
echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              Smoke Tests Complete                     ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║  For WebSocket testing, run:                          ║"
echo "║    node tests/ws-test-client.js                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
