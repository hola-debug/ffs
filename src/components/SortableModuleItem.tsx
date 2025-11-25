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
        // ✅ CSS.Translate es más rápido que CSS.Transform
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        // ✅ Sin transición durante drag para evitar vibración
        transition: isDragging ? undefined : transition,
        // ✅ willChange optimiza el rendering del navegador
        willChange: isDragging ? 'transform' : undefined,
        zIndex: isDragging ? 10 : undefined,
        // ✅ Necesario para que funcione touch en mobile
        touchAction: 'none',
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
