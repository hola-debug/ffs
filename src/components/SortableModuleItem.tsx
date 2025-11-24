import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, CSSProperties } from 'react';

interface SortableModuleItemProps {
    id: string;
    children: ReactNode;
}

export function SortableModuleItem({ id, children }: SortableModuleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    // Enhanced transform with scale effect during drag
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        // Enhanced shadow and elevation during drag
        filter: isDragging ? 'brightness(1.05)' : undefined,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        relative 
        cursor-grab 
        active:cursor-grabbing
        touch-none
        transition-all
        duration-200
        ${isDragging ? 'scale-[1.02] shadow-2xl opacity-90' : 'hover:scale-[1.005]'}
      `}
        >
            {/* Visual indicator - subtle dots on the right side */}
            <div
                className={`
          absolute 
          right-3 
          top-1/2 
          -translate-y-1/2 
          z-10
          pointer-events-none
          transition-opacity 
          duration-300
          ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-60'}
        `}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="6" cy="5" r="1.5" fill="currentColor" className="text-white/60" />
                    <circle cx="14" cy="5" r="1.5" fill="currentColor" className="text-white/60" />
                    <circle cx="6" cy="10" r="1.5" fill="currentColor" className="text-white/60" />
                    <circle cx="14" cy="10" r="1.5" fill="currentColor" className="text-white/60" />
                    <circle cx="6" cy="15" r="1.5" fill="currentColor" className="text-white/60" />
                    <circle cx="14" cy="15" r="1.5" fill="currentColor" className="text-white/60" />
                </svg>
            </div>

            {/* Dragging overlay effect */}
            {isDragging && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none" />
            )}

            {/* Module Content */}
            <div className="relative z-0">
                {children}
            </div>
        </div>
    );
}
