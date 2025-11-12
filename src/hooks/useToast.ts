import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToasts = useCallback((messages: string[], type: Toast['type'] = 'success') => {
    messages.forEach((message, index) => {
      setTimeout(() => {
        addToast(message, type);
      }, index * 3200); // 3.2s entre cada notificación
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showToasts,
  };
}
