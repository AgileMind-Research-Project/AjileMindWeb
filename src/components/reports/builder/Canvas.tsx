import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ReportElement } from '@/types/report';
import { SortableElement } from './SortableElement';

interface CanvasProps {
  elements: ReportElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Canvas({ elements, selectedId, onSelect, onDelete }: CanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas-droppable',
  });

  return (
    <div className="flex-1 flex flex-col p-8">
      <div 
        ref={setNodeRef}
        className="flex-1 flex flex-col min-h-[100px]"
      >
        <SortableContext 
          items={elements.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {elements.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400 text-sm">Drag and drop elements here</p>
            </div>
          ) : (
            elements.map((element) => (
              <SortableElement
                key={element.id}
                element={element}
                isSelected={selectedId === element.id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
