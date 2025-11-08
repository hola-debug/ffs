// Configuración de webhooks para n8n
// Actualiza estas URLs cuando configures tu servidor n8n

export const AI_CONFIG = {
  // Webhook para mensajes de texto
  textWebhook: import.meta.env.VITE_N8N_TEXT_WEBHOOK || 'https://your-n8n-webhook.com/ai-transaction',
  
  // Webhook para mensajes de voz
  voiceWebhook: import.meta.env.VITE_N8N_VOICE_WEBHOOK || 'https://your-n8n-webhook.com/ai-voice-transaction',
  
  // Configuración de grabación de audio
  recording: {
    maxDuration: 30000, // 30 segundos máximo
    mimeType: 'audio/webm',
  },
};
