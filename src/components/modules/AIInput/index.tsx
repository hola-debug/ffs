import { useState, useRef, useEffect, useCallback } from 'react';
import { BaseCard } from '../BaseCard';
import { useAuth } from '../../../contexts/AuthContext';
import { AI_CONFIG } from '../../../config/ai.config';

interface AIInputModuleProps {
  onRefresh?: () => void;
}

export function AIInputModule({ onRefresh }: AIInputModuleProps) {
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [hasMicrophone, setHasMicrophone] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const clearFeedbackTimeout = () => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };

  const showFeedback = useCallback((text: string, duration = 3000) => {
    clearFeedbackTimeout();
    setFeedback(text);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback('');
    }, duration);
  }, []);

  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasMicrophone(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some((device) => device.kind === 'audioinput');
        setHasMicrophone(hasAudio);
      } catch {
        setHasMicrophone(false);
      }
    };

    checkMicrophone();

    return () => {
      clearFeedbackTimeout();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
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
          sessionId: `session-${user?.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
        }),
      });

      await response.json();
      showFeedback('Se registró con éxito');

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

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('userId', user?.id || '');
      formData.append('type', 'voice');
      formData.append('sessionId', `session-${user?.id}-${Date.now()}`);
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(AI_CONFIG.voiceWebhook, {
        method: 'POST',
        body: formData,
      });

      await response.json();
      showFeedback('Se registró con éxito');

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

  const startRecording = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showFeedback('❌ Tu navegador no soporta grabación de audio');
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some((device) => device.kind === 'audioinput');

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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      showFeedback('Grabando...', 30000);
    } catch (error: any) {
      console.error('Error al acceder al micrófono:', error);

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

  const stopRecording = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <BaseCard
      variant="solid"
      className="col-span-2 bg-black   rounded-xl sm:rounded-2xl "
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* Input principal negro / glass */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording ? 'Grabando...' : 'Agregar algo'
          }
          className={`
            bg-black
            w-full 
            text-white 
            px-5 py-4 
            ${hasMicrophone ? 'pr-28' : 'pr-16'}
            focus:outline-none 
            border-none
          `}
          disabled={isLoading || isRecording}
        />

        {/* Feedback badge sobre negro */}
        {feedback && (
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 left-5 
              text-[11px] font-medium px-3 py-1.5 rounded-full
              backdrop-blur-xl
              border
              animate-in fade-in slide-in-from-left-2 duration-200
              ${
                feedback.includes('Error') || feedback.includes('❌')
                  ? 'bg-red-500/15 text-red-300 border-red-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              }
            `}
          >
            {feedback.replace(/[❌✅]/g, '').trim()}
          </div>
        )}

        {/* Botones lado derecho */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
          {/* Enviar */}
          <button
            type="submit"
            disabled={isLoading || !message.trim() || isRecording}
            className={`
              w-10 h-10 
              rounded-xl
             
              flex items-center justify-center 
            `}
            title="Enviar"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 
                  1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform duration-200"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>

          {/* Voz */}
          {hasMicrophone && (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`
                w-10 h-10 rounded-xl
                flex items-center justify-center
                transition-all duration-200 ease-out
                shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                ${
                  isRecording
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_14px_45px_rgba(248,113,113,0.7)] hover:scale-105 animate-pulse'
                    : 'bg-zinc-900 border border-white/15 hover:bg-zinc-800'
                }
              `}
              title={isRecording ? 'Detener' : 'Grabar'}
            >
              {isRecording ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 
                    0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </form>
    </BaseCard>
  );
}
