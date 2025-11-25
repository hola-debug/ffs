import { useDndMonitor } from '@dnd-kit/core';
import { useState } from 'react';

/**
 * Hook para detectar globalmente si hay un drag activo.
 * Útil para bloquear modales, clicks, etc. durante drag.
 */
export function useDragState() {
  const [isDragging, setIsDragging] = useState(false);

  useDndMonitor({
    onDragStart() {
      setIsDragging(true);
    },
    onDragEnd() {
      setIsDragging(false);
    },
    onDragCancel() {
      setIsDragging(false);
    },
  });

  return isDragging;
}
