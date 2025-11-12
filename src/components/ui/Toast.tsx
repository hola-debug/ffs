import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return '💡';
      case 'error':
        return '❌';
      default:
        return '✅';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400/50';
      case 'info':
        return 'bg-blue-500/90 border-blue-400/50';
      case 'error':
        return 'bg-red-500/90 border-red-400/50';
      default:
        return 'bg-green-500/90 border-green-400/50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        ${getColors()}
        backdrop-blur-xl
        border
        rounded-2xl
        px-4 py-3
        shadow-2xl
        flex items-center gap-3
        max-w-md
        mx-auto
        pointer-events-auto
      `}
    >
      <span className="text-xl">{getIcon()}</span>
      <p className="text-white text-sm font-medium flex-1">{message}</p>
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
