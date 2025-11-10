// Configuración de webhooks para n8n
// Actualiza estas URLs cuando configures tu servidor n8n

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK || 'https://centro-n8n.xqnwvv.easypanel.host/webhook/9d14f317-70b7-4f91-9272-7794e92a7dda';

export const AI_CONFIG = {
  textWebhook: WEBHOOK_URL,
  voiceWebhook: WEBHOOK_URL,
  recording: {
    maxDuration: 30000,
    mimeType: 'audio/webm',
  },
};
