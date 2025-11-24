import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ReportSection, ReportElement } from '@/types/report';
import { SortableElement } from './SortableElement';

interface HeaderEditorProps {
  section: ReportSection;
  onChange: (section: ReportSection) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HeaderEditor({ section, onChange, selectedId, onSelect, onDelete }: HeaderEditorProps) {
  const { setNodeRef } = useDroppable({
    id: 'header-droppable',
  });

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Header</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Height (px)</label>
          <input
            type="number"
            value={section.height}
            onChange={(e) => onChange({ ...section, height: parseInt(e.target.value) })}
            className="w-16 p-1 text-xs border border-gray-300 rounded"
          />
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className="bg-white border border-dashed border-gray-300 min-h-[50px] p-2"
        style={{ height: section.height, overflow: 'hidden' }}
      >
        <SortableContext 
          items={section.elements.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.elements.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Header Content
            </div>
          ) : (
            section.elements.map((element) => (
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
