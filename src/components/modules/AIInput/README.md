# Módulo de IA para Transacciones

Módulo minimalista integrado al dashboard para registrar transacciones con inteligencia artificial.

## Diseño

```
┌─────────────────────────────────────────────────┐
│  [  Registra una transacción...    ] [📤] [🎤] │
└─────────────────────────────────────────────────┘
```

## Características

- **Input de texto**: Campo de texto para escribir transacciones en lenguaje natural
- **Botón enviar**: Ícono de envío que se transforma en spinner al procesar
- **Botón de voz**: Ícono de micrófono que se vuelve rojo al grabar
- **Feedback inline**: Badge sutil que aparece dentro del input mostrando el resultado
- **Auto-refresh**: Actualiza el dashboard automáticamente después de registrar

## Uso

### Texto
1. Escribe: "gasté 500 en almuerzo"
2. Presiona el botón de envío o Enter
3. La IA procesa y registra la transacción

### Voz
1. Presiona el botón del micrófono
2. Habla tu transacción
3. Presiona nuevamente para detener
4. La IA transcribe, procesa y registra

## Configuración

Agregar a `.env`:

```env
VITE_N8N_TEXT_WEBHOOK=https://tu-n8n.com/webhook/ai-transaction
VITE_N8N_VOICE_WEBHOOK=https://tu-n8n.com/webhook/ai-voice-transaction
```

## Estados visuales

- **Normal**: Botón de voz gris
- **Grabando**: Botón de voz rojo con pulse animation
- **Procesando**: Botón de envío con spinner
- **Éxito**: Badge verde con mensaje
- **Error**: Badge rojo con mensaje
