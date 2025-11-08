import { useState, useRef } from 'react';
import { BaseCard } from '../BaseCard';
import { useAuth } from '../../../contexts/AuthContext';
import { AI_CONFIG } from '../../../config/ai.config';

interface AIInputModuleProps {
  onRefresh?: () => void;
}

export function AIInputModule({ onRefresh }: AIInputModuleProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const showFeedback = (text: string, duration = 3000) => {
    setFeedback(text);
    setTimeout(() => setFeedback(''), duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(AI_CONFIG.textWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id,
          type: 'text',
        }),
      });

      const result = await response.json();
      showFeedback(result.message || '✅ Transacción registrada');
      
      // Refrescar el dashboard después de 1 segundo
      setTimeout(() => {
        onRefresh?.();
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      showFeedback('❌ Error al procesar');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showFeedback('❌ Tu navegador no soporta grabación de audio');
        return;
      }

      // Primero verificar si hay dispositivos de audio
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some(device => device.kind === 'audioinput');
      
      if (!hasAudioInput) {
        showFeedback('❌ No se encontró micrófono conectado');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      showFeedback('Grabando...', 30000);

    } catch (error: any) {
      console.error('Error al acceder al micrófono:', error);
      
      // Errores específicos
      if (error.name === 'NotFoundError') {
        showFeedback('❌ No se encontró micrófono');
      } else if (error.name === 'NotAllowedError') {
        showFeedback('❌ Permiso denegado. Habilita el micrófono en tu navegador');
      } else if (error.name === 'NotReadableError') {
        showFeedback('❌ El micrófono está siendo usado por otra app');
      } else {
        showFeedback('❌ Error al acceder al micrófono');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('userId', user?.id || '');
      formData.append('type', 'voice');

      const response = await fetch(AI_CONFIG.voiceWebhook, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      showFeedback(result.message || '✅ Transacción de voz registrada');

      // Refrescar el dashboard después de 1 segundo
      setTimeout(() => {
        onRefresh?.();
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      showFeedback('❌ Error al procesar audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseCard variant="gradient" className="col-span-2">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isRecording ? "Grabando..." : "Registra una transacción..."}
          className="w-full bg-gray-800/50 text-white px-4 py-4 pr-28 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500 transition-all"
          disabled={isLoading || isRecording}
        />
        
        {/* Feedback badge */}
        {feedback && (
          <div className={`absolute top-1/2 -translate-y-1/2 left-4 text-xs px-2 py-1 rounded ${
            feedback.includes('Error') || feedback.includes('❌')
              ? 'bg-red-500/20 text-red-300'
              : 'bg-green-500/20 text-green-300'
          }`}>
            {feedback.replace(/[❌✅]/g, '').trim()}
          </div>
        )}

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {/* Botón enviar */}
          <button
            type="submit"
            disabled={isLoading || !message.trim() || isRecording}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center group"
            title="Enviar"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>

          {/* Botón voz */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? "Detener" : "Grabar"}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </BaseCard>
  );
}
