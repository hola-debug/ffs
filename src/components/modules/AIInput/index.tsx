import { useState, useRef, useEffect, useCallback } from 'react';
import { BaseCard } from '../BaseCard';
import { useAuth } from '../../../contexts/AuthContext';
import { AI_CONFIG } from '../../../config/ai.config';

type ProcessingStage = 'sending' | 'processing' | 'finalizing' | null;

// Función para obtener fecha en zona horaria Argentina (UTC-3)
const getArgentinaTimestamp = (): string => {
  const now = new Date();
  // Convertir a UTC-3 (Argentina)
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const localOffset = now.getTimezoneOffset(); // offset local en minutos
  const argentinaTime = new Date(now.getTime() + (localOffset + argentinaOffset) * 60000);
  return argentinaTime.toISOString();
};

interface AIInputModuleProps {
  onRefresh?: () => void;
  showToasts?: (messages: string[], type?: 'success' | 'info' | 'error') => void;
}

export function AIInputModule({ onRefresh, showToasts }: AIInputModuleProps) {
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(null);
  const [progress, setProgress] = useState(0);

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

  // Sistema de cola de mensajes
  const showMessagesSequentially = useCallback((messages: string[]) => {
    setMessageQueue(messages);
  }, []);

  // Procesar cola de mensajes
  useEffect(() => {
    if (messageQueue.length === 0) return;

    const currentMessage = messageQueue[0];
    showFeedback(currentMessage, 3000);

    const timer = setTimeout(() => {
      setMessageQueue(prev => prev.slice(1));
    }, 3200); // 3s mostrar + 0.2s transición

    return () => clearTimeout(timer);
  }, [messageQueue, showFeedback]);

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
    setProgress(0);
    
    // Simular progreso mientras se procesa
    setProcessingStage('sending');
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      setProcessingStage('processing');
      
      const response = await fetch(AI_CONFIG.textWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: user?.id,
          type: 'text',
          sessionId: `session-${user?.id}-${Date.now()}`,
          timestamp: getArgentinaTimestamp(),
        }),
      });

      setProcessingStage('finalizing');
      setProgress(95);

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = {
          success: response.ok,
          message: text,
          suggestions: []
        };
      }
      
      setProgress(100);
      
      if (result.success) {
        const messages: string[] = [];
        
        if (result.message) {
          messages.push(result.message);
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          result.suggestions.slice(0, 2).forEach((suggestion: string) => {
            messages.push(suggestion);
          });
        }
        
        if (showToasts && messages.length > 0) {
          if (messages.length > 1) {
            showToasts([messages[0]], 'success');
            showToasts(messages.slice(1), 'info');
          } else {
            showToasts(messages, 'success');
          }
        }
      } else {
        if (showToasts) {
          showToasts(['No se pudo completar la operación'], 'error');
        }
      }

      setTimeout(() => {
        onRefresh?.();
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      if (showToasts) {
        showToasts(['Error al procesar el mensaje'], 'error');
      }
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setProcessingStage(null);
      setProgress(0);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsLoading(true);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 12;
      });
    }, 350);

    try {
      setProcessingStage('sending');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');
      formData.append('userId', user?.id || '');
      formData.append('type', 'voice');
      formData.append('sessionId', `session-${user?.id}-${Date.now()}`);
      formData.append('timestamp', getArgentinaTimestamp());

      setProcessingStage('processing');
      
      const response = await fetch(AI_CONFIG.voiceWebhook, {
        method: 'POST',
        body: formData,
      });

      setProcessingStage('finalizing');
      setProgress(95);

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = {
          success: response.ok,
          message: text,
          suggestions: []
        };
      }
      
      setProgress(100);
      
      if (result.success) {
        const messages: string[] = [];
        
        if (result.message) {
          messages.push(result.message);
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          result.suggestions.slice(0, 2).forEach((suggestion: string) => {
            messages.push(suggestion);
          });
        }
        
        if (showToasts && messages.length > 0) {
          if (messages.length > 1) {
            showToasts([messages[0]], 'success');
            showToasts(messages.slice(1), 'info');
          } else {
            showToasts(messages, 'success');
          }
        }
      } else {
        if (showToasts) {
          showToasts(['No se pudo completar la operación'], 'error');
        }
      }

      setTimeout(() => {
        onRefresh?.();
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      if (showToasts) {
        showToasts(['Error al procesar el audio'], 'error');
      }
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setProcessingStage(null);
      setProgress(0);
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

  const getProcessingMessage = () => {
    if (isRecording) return 'Grabando';
    if (!processingStage) return null;
    
    switch (processingStage) {
      case 'sending': return 'Enviando';
      case 'processing': return 'Procesando';
      case 'finalizing': return 'Finalizando';
      default: return null;
    }
  };

  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-3 text-white font-sans relative w-full overflow-hidden h-[70px] flex items-center">
      {/* Barra de progreso */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center gap-2">
          {/* Input compacto */}
          <div className="relative flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? '🎙️ Grabando...' : (isLoading ? '' : ' Escribe algo...')}
              className="
                bg-white/5
                w-full 
                text-white 
                px-3 py-2
                pr-3
                focus:outline-none 
                focus:bg-white/10
                border border-white/10
                focus:border-white/20
                placeholder:text-white/30
                text-sm
                rounded-lg
                transition-all duration-200
              "
              disabled={isLoading || isRecording}
            />
            
            {/* Estado de procesamiento */}
            {(isLoading || isRecording) && getProcessingMessage() && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-medium text-white/60">
                  {getProcessingMessage()}
                </span>
              </div>
            )}

            {/* Feedback de errores */}
            {feedback && (
              <div
                className={`
                  absolute left-3 top-1/2 -translate-y-1/2
                  text-[10px] font-medium px-2 py-1 rounded
                  backdrop-blur-xl
                  animate-in fade-in duration-200
                  bg-black/90 border border-white/10
                  ${
                    feedback.includes('Error') || feedback.includes('❌')
                      ? 'text-red-300'
                      : 'text-white/90'
                  }
                `}
              >
                {feedback.replace(/[❌✅🤔🎙]/g, '').trim()}
              </div>
            )}
          </div>

          {/* Botones compactos */}
          <div className="flex gap-1.5 shrink-0">
            {/* Botón enviar */}
            <button
              type="submit"
              disabled={isLoading || !message.trim() || isRecording}
              className={`
                w-9 h-9 
                rounded-lg
                flex items-center justify-center 
                transition-all duration-200
                disabled:opacity-20 disabled:cursor-not-allowed
                relative overflow-hidden
                ${
                  message.trim() && !isLoading && !isRecording
                    ? 'bg-white/10 hover:bg-white/15 border border-white/20 hover:scale-105'
                    : 'bg-white/5 border border-white/10'
                }
              `}
              title="Enviar"
            >
              {isLoading ? (
                <div className="relative">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>

            {/* Botón voz */}
            {hasMicrophone && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`
                  w-9 h-9 rounded-lg
                  flex items-center justify-center
                  transition-all duration-200
                  disabled:opacity-20 disabled:cursor-not-allowed
                  relative overflow-hidden
                  ${
                    isRecording
                      ? 'bg-red-500/90 border border-red-400/50 scale-105'
                      : 'bg-white/10 border border-white/20 hover:bg-white/15 hover:scale-105'
                  }
                `}
                title={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
              >
                {isRecording && (
                  <span className="absolute inset-0 bg-red-400/30 animate-ping" />
                )}
                {isRecording ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white relative z-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
