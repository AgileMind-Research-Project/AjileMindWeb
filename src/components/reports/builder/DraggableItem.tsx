import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { LucideIcon } from 'lucide-react';

interface DraggableItemProps {
  id: string;
  type: string;
  label: string;
  icon: LucideIcon;
}

export function DraggableItem({ id, type, label, icon: Icon }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: {
      type,
      isSidebarItem: true,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm cursor-move hover:border-blue-500 hover:shadow-md transition-all"
    >
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}
