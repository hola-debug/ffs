import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, CSSProperties, useRef } from 'react';

interface SortableModuleItemProps {
    id: string;
    children: ReactNode;
    isEditMode: boolean;
    onEnableEditMode: () => void;
}

export function SortableModuleItem({
    id,
    children,
    isEditMode,
    onEnableEditMode,
}: SortableModuleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditMode });

    const timeoutRef = useRef<number | null>(null);
    const pressedRef = useRef(false);

    const style: CSSProperties = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? undefined : transition,
        willChange: isDragging ? 'transform' : undefined,
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'none',
    };

    // --- LONG PRESS (para entrar en edit mode) ---
    const startLongPress = (e: React.PointerEvent) => {
        // Si ya estamos en editMode, que el overlay no moleste
        if (isEditMode) return;

        pressedRef.current = true;

        // Evitamos que se dispare click raro al soltar
        e.preventDefault();

        // 700–800ms se siente más “iOS” que 2000ms
        timeoutRef.current = window.setTimeout(() => {
            if (!pressedRef.current) return;
            onEnableEditMode();
            // Una vez entra en edit mode, el overlay pasa a pointer-events:none
        }, 800);
    };

    const cancelLongPress = () => {
        pressedRef.current = false;
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(isEditMode ? listeners : {})} // 👈 listeners sólo en edit mode
            className={`
        relative
        transition-transform
        duration-200
        ${isDragging ? 'scale-[1.02] shadow-2xl opacity-90' : 'hover:scale-[1.005]'}
        ${isEditMode && !isDragging ? 'animate-jiggle cursor-grab' : ''}
      `}
        >
            {/* Overlay para detectar long-press cuando NO estamos en edit mode */}
            <div
                className={`
          absolute inset-0 z-20
          ${isEditMode ? 'pointer-events-none' : 'cursor-pointer'}
        `}
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
            />

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
