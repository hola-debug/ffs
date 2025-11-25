import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, CSSProperties, useRef } from 'react';

interface SortableModuleItemProps {
    id: string;
    children: ReactNode;
    isEditMode: boolean;
    onEnableEditMode: () => void;
    onDisableEditMode: () => void;
    index: number;
}

export function SortableModuleItem({
    id,
    children,
    isEditMode,
    onEnableEditMode,
    onDisableEditMode,
    index,
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
    const pointerStartRef = useRef<{ x: number; y: number; time: number }>({
        x: 0,
        y: 0,
        time: 0,
    });

    const LONG_PRESS_MS = 750;
    const TAP_MAX_MS = 200;
    const MOVE_THRESHOLD_PX = 5;
    const MOVE_CANCEL_LONG_PRESS_PX = 8; // margen mayor para jitter en móvil

    const triggerHaptics = () => {
        if (!navigator.vibrate) return;
        navigator.vibrate([10, 40, 10, 40, 20]);
        window.setTimeout(() => navigator.vibrate([5, 30, 10]), 140);
    };

    const enableEditMode = () => {
        onEnableEditMode();
        triggerHaptics();
    };

    const style: CSSProperties = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? undefined : transition,
        willChange: isDragging ? 'transform' : undefined,
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'none',
        opacity: isDragging ? 0 : 1, // dejar hueco libre mientras usamos el DragOverlay
        animationDelay: isEditMode && !isDragging ? `${index * 40}ms` : undefined,
    };

    const cancelLongPress = () => {
        pressedRef.current = false;
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        pointerStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            time: performance.now(),
        };

        if (!isEditMode) {
            pressedRef.current = true;
            e.preventDefault();
            timeoutRef.current = window.setTimeout(() => {
                if (!pressedRef.current) return;
                enableEditMode();
            }, LONG_PRESS_MS);
        }

        if (isEditMode && listeners?.onPointerDown) {
            listeners.onPointerDown(e);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        if (
            !isEditMode &&
            (dx > MOVE_CANCEL_LONG_PRESS_PX || dy > MOVE_CANCEL_LONG_PRESS_PX)
        ) {
            cancelLongPress();
        }

        if (isEditMode && listeners?.onPointerMove) {
            listeners.onPointerMove(e);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const elapsed = performance.now() - pointerStartRef.current.time;
        const distance = Math.hypot(
            e.clientX - pointerStartRef.current.x,
            e.clientY - pointerStartRef.current.y
        );

        cancelLongPress();

        if (
            isEditMode &&
            !isDragging &&
            elapsed <= TAP_MAX_MS &&
            distance <= MOVE_THRESHOLD_PX
        ) {
            onDisableEditMode();
        }

        if (isEditMode && listeners?.onPointerUp) {
            listeners.onPointerUp(e);
        }
    };

    const handlePointerLeave = (e: React.PointerEvent) => {
        cancelLongPress();
        if (isEditMode && listeners?.onPointerLeave) {
            listeners.onPointerLeave(e);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(isEditMode ? listeners : {})}
            // Listeners del DnD se ejecutan desde los handlers para poder mezclar la lógica de tap/drag
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={cancelLongPress}
            className={`
        relative
        transition-transform
        duration-200
        ${isDragging ? 'scale-[1.02] shadow-2xl opacity-90' : 'hover:scale-[1.005]'}
        ${isEditMode && !isDragging ? 'edit-mode-active cursor-grab' : ''}
      `}
        >
            {/* Overlay para detectar long-press cuando NO estamos en edit mode */}
            <div
                className={`
          absolute inset-0 z-20
          ${isEditMode ? 'pointer-events-none' : 'cursor-pointer'}
        `}
                style={{ touchAction: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
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
