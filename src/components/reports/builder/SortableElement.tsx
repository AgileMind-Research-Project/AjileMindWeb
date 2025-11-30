import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReportElement } from '@/types/report';
import { Type, Image, Table, Minus, MoveVertical, Trash2, GripVertical } from 'lucide-react';

interface SortableElementProps {
  element: ReportElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SortableElement({ element, isSelected, onSelect, onDelete }: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = () => {
    switch (element.type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'table': return Table;
      case 'divider': return Minus;
      case 'spacer': return MoveVertical;
      default: return Type;
    }
  };

  const Icon = getIcon();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group flex items-start gap-2 p-3 mb-2 rounded-md border-2 transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300 bg-white'}
      `}
      onClick={() => onSelect(element.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Content Preview */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3 h-3 text-gray-500" />
          <span className="text-xs font-medium text-gray-500 uppercase">{element.type}</span>
        </div>
        
        <div className="text-sm text-gray-900">
          {element.type === 'text' && (
            <div style={{ 
              textAlign: element.style.textAlign,
              fontWeight: element.style.fontWeight,
              fontStyle: element.style.fontStyle,
            }}>
              {element.content || 'Empty text block'}
            </div>
          )}
          {element.type === 'image' && (
            <div className="min-h-[80px] bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs overflow-hidden">
              {element.content ? (
                <img 
                  src={element.content} 
                  alt="Element preview" 
                  className="max-w-full max-h-[200px] object-contain"
                  style={{ width: element.style.width }}
                />
              ) : (
                'Image Placeholder'
              )}
            </div>
          )}
          {element.type === 'divider' && <hr className="border-gray-300" />}
          {element.type === 'spacer' && <div className="h-8 bg-gray-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">Spacer</div>}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(element.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
