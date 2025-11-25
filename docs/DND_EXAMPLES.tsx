/**
 * Ejemplo de uso del patrón Drag Handle + useDragState
 * 
 * Este archivo muestra cómo aplicar el mismo patrón a otros componentes
 */

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { useDragState } from '../hooks/useDragState';

// ============================================
// EJEMPLO 1: Lista de Tareas Sortable
// ============================================

interface Task {
    id: string;
    title: string;
    completed: boolean;
}

function SortableTaskItem({ task }: { task: Task }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? undefined : transition,
        zIndex: isDragging ? 10 : undefined,
        willChange: isDragging ? 'transform' : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 p-4 bg-white rounded-lg shadow
        ${isDragging ? 'opacity-50' : ''}
      `}
        >
            {/* Drag Handle */}
            <button
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
            >
                ⠿
            </button>

            {/* Checkbox (clickeable, no activa drag) */}
            <input
                type="checkbox"
                checked={task.completed}
                onChange={() => {/* toggle */ }}
                className="w-5 h-5"
            />

            {/* Título */}
            <span className={task.completed ? 'line-through' : ''}>
                {task.title}
            </span>
        </div>
    );
}

export function TaskListExample() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: '1', title: 'Comprar leche', completed: false },
        { id: '2', title: 'Llamar al médico', completed: true },
        { id: '3', title: 'Estudiar React', completed: false },
    ]);

    const isDragging = useDragState();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = [...items];
                const [removed] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, removed);
                return newItems;
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <SortableTaskItem key={task.id} task={task} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

// ============================================
// EJEMPLO 2: Cards con Modal (bloqueado durante drag)
// ============================================

interface Card {
    id: string;
    title: string;
    description: string;
}

function SortableCard({ card }: { card: Card }) {
    const isDragging = useDragState();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging: isThisCardDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isThisCardDragging ? undefined : transition,
        zIndex: isThisCardDragging ? 10 : undefined,
        willChange: isThisCardDragging ? 'transform' : undefined,
    };

    const handleCardClick = () => {
        // ⛔ Bloquear apertura de modal si hay drag activo
        if (isDragging) return;
        setIsModalOpen(true);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white"
            >
                {/* Drag Handle */}
                <button
                    ref={setActivatorNodeRef}
                    {...listeners}
                    {...attributes}
                    style={{ touchAction: 'none' }}
                    className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/30 rounded-lg cursor-grab active:cursor-grabbing"
                >
                    ⠿
                </button>

                {/* Contenido clickeable (no activa drag) */}
                <div onClick={handleCardClick} className="cursor-pointer">
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-sm opacity-90">{card.description}</p>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md">
                        <h2 className="text-2xl font-bold mb-4">{card.title}</h2>
                        <p className="mb-4">{card.description}</p>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================
// EJEMPLO 3: Componente Reutilizable de Drag Handle
// ============================================

interface DragHandleProps {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    listeners: any;
    attributes: any;
    isDragging: boolean;
    variant?: 'default' | 'minimal' | 'icon';
}

export function DragHandle({
    setActivatorNodeRef,
    listeners,
    attributes,
    isDragging,
    variant = 'default',
}: DragHandleProps) {
    const variants = {
        default: 'p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg',
        minimal: 'p-1 hover:bg-white/10 rounded',
        icon: 'p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg',
    };

    return (
        <button
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            style={{ touchAction: 'none' }}
            className={`
        transition-all duration-200
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${variants[variant]}
        active:scale-95
      `}
            aria-label="Arrastrar elemento"
        >
            {/* Icono de 6 puntos */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/70">
                <circle cx="4" cy="4" r="1.5" fill="currentColor" />
                <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                <circle cx="4" cy="8" r="1.5" fill="currentColor" />
                <circle cx="12" cy="8" r="1.5" fill="currentColor" />
                <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
        </button>
    );
}

// Uso del componente reutilizable:
function ExampleWithReusableHandle({ item }: { item: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition: isDragging ? undefined : transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative p-4 bg-white rounded-lg">
            <div className="absolute top-2 right-2">
                <DragHandle
                    setActivatorNodeRef={setActivatorNodeRef}
                    listeners={listeners}
                    attributes={attributes}
                    isDragging={isDragging}
                    variant="default"
                />
            </div>
            <div>{item.content}</div>
        </div>
    );
}

// ============================================
// EJEMPLO 4: Drag Handle con Tooltip
// ============================================

function DragHandleWithTooltip({
    setActivatorNodeRef,
    listeners,
    attributes,
    isDragging,
}: DragHandleProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <button
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
                style={{ touchAction: 'none' }}
                className={`
          p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg
          transition-all duration-200
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                ⠿
            </button>

            {/* Tooltip */}
            {showTooltip && !isDragging && (
                <div className="absolute top-full right-0 mt-2 px-3 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
                    Arrastra para reordenar
                </div>
            )}
        </div>
    );
}

// ============================================
// EJEMPLO 5: Diferentes Modifiers
// ============================================

export function ExamplesWithDifferentModifiers() {
    return (
        <div className="space-y-8">
            {/* Solo vertical */}
            <DndContext modifiers={[restrictToVerticalAxis]}>
                <h3>Solo movimiento vertical</h3>
                {/* ... */}
            </DndContext>

            {/* Solo horizontal */}
            <DndContext modifiers={[restrictToHorizontalAxis]}>
                <h3>Solo movimiento horizontal</h3>
                {/* ... */}
            </DndContext>

            {/* Snap to grid */}
            <DndContext modifiers={[snapToGrid(20)]}>
                <h3>Snap to grid (20px)</h3>
                {/* ... */}
            </DndContext>

            {/* Múltiples modifiers */}
            <DndContext
                modifiers={[
                    restrictToVerticalAxis,
                    restrictToWindowEdges,
                    snapCenterToCursor,
                ]}
            >
                <h3>Vertical + Window Edges + Snap to Cursor</h3>
                {/* ... */}
            </DndContext>
        </div>
    );
}

// ============================================
// TIPS Y MEJORES PRÁCTICAS
// ============================================

/**
 * ✅ DO:
 * 
 * 1. Usar drag handle para elementos con contenido interactivo
 * 2. Bloquear modales/acciones durante drag con useDragState()
 * 3. Usar CSS.Translate en lugar de CSS.Transform
 * 4. Aplicar touchAction: 'none' solo al handle
 * 5. Usar modifiers para restringir movimiento
 * 
 * ❌ DON'T:
 * 
 * 1. No aplicar {...listeners} al container completo
 * 2. No usar filter: brightness() durante drag (costoso)
 * 3. No olvidar setActivatorNodeRef en el handle
 * 4. No usar CSS.Transform si puedes usar CSS.Translate
 */
