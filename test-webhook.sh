#!/bin/bash

# Test del webhook de n8n para FFS Finance
# Uso: ./test-webhook.sh

# ⚠️ IMPORTANTE: Reemplaza estos valores
WEBHOOK_URL="https://centro-n8n.xqnwvv.easypanel.host/webhook/9d14f317-70b7-4f91-9272-7794e92a7dda"
USER_ID="TU-USER-ID-AQUI"  # 👈 Reemplazar con un UUID real de tu tabla profiles

echo "🧪 Testeando webhook de n8n..."
echo "URL: $WEBHOOK_URL"
echo "User ID: $USER_ID"
echo ""

# Test 1: Mensaje de texto
echo "📤 Test 1: Mensaje de texto"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"text\",
    \"userId\": \"$USER_ID\",
    \"message\": \"cuánto tengo disponible\"
  }" | jq .

echo ""
echo "✅ Test completado"
