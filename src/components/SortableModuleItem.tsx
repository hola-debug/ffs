import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode, CSSProperties } from 'react';

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

    const style: CSSProperties = {
        // Aseguramos que no explote si transform es null
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        // Cuando estás arrastrando, conviene quitar la transición para que no se vea “elástica”
        transition: isDragging ? undefined : transition ?? 'transform 200ms ease',
        filter: isDragging ? 'brightness(1.05)' : undefined,
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'none', // importante para mobile, evita scroll raro
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners} // 👉 manejamos drag directamente en el wrapper
            className={`
        relative
        cursor-grab
        active:cursor-grabbing
        transition-transform
        duration-200
        ${isDragging ? 'scale-[1.02] shadow-2xl opacity-90' : 'hover:scale-[1.005]'}
      `}
        >
            {/* Overlay visual cuando se está arrastrando */}
            {isDragging && (
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
            )}

            {/* Contenido real del módulo */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
