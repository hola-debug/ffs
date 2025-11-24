import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            {/* Drag Handle - Visible on hover */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/10 backdrop-blur-sm rounded-lg p-2 hover:bg-white/20"
                title="Arrastra para reordenar"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="5" cy="4" r="1.5" fill="currentColor" className="text-white/70" />
                    <circle cx="11" cy="4" r="1.5" fill="currentColor" className="text-white/70" />
                    <circle cx="5" cy="8" r="1.5" fill="currentColor" className="text-white/70" />
                    <circle cx="11" cy="8" r="1.5" fill="currentColor" className="text-white/70" />
                    <circle cx="5" cy="12" r="1.5" fill="currentColor" className="text-white/70" />
                    <circle cx="11" cy="12" r="1.5" fill="currentColor" className="text-white/70" />
                </svg>
            </div>

            {/* Module Content */}
            {children}
        </div>
    );
}
