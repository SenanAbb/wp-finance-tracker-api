#!/bin/bash

# Script para iniciar el servidor con ngrok
# Esto expone el servidor local para que Twilio pueda acceder

echo "🚀 Iniciando servidor API..."
npm start &
SERVER_PID=$!

sleep 3

echo "🌐 Iniciando ngrok tunnel..."
echo "📝 Copia la URL HTTPS que aparece y configúrala en Twilio:"
echo "   https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox"
echo ""

# Iniciar ngrok en el puerto 3001
ngrok http 3001

# Cuando se cierre ngrok, matar el servidor
kill $SERVER_PID
