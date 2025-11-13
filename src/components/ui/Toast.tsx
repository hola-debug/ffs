import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassSurface from '../GlassSurface';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        };
      case 'info':
        return {
          glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
        };
      case 'error':
        return {
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
        };
      default:
        return {
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.85, 
        y: -20,
        transition: { 
          duration: 0.3,
          ease: [0.4, 0, 1, 1] // easeIn para salida más fluida
        }
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        opacity: { duration: 0.2 }
      }}
      className="max-w-md mx-auto pointer-events-auto"
    >
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={16}
        brightness={type === 'error' ? 35 : type === 'info' ? 40 : 45}
        opacity={0.95}
        blur={15}
        displace={8}
        distortionScale={-160}
        redOffset={type === 'error' ? 10 : 3}
        greenOffset={type === 'success' ? 15 : 8}
        blueOffset={type === 'info' ? 20 : 12}
        mixBlendMode="screen"
        className={`${styles.glow} relative overflow-hidden`}
      >
        <div className="flex items-center justify-center w-full px-4 py-2">
          {/* Message */}
          <p className="text-white/95 text-sm font-medium text-center leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Progress bar */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white/30 via-white/60 to-white/30"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      </GlassSurface>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'info' | 'error' }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] pointer-events-none px-4">
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => onRemove(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
