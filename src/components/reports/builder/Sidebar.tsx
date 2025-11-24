import React from 'react';
import { Type, Image, Table, Minus, MoveVertical } from 'lucide-react';
import { DraggableItem } from './DraggableItem';

export function Sidebar() {
  const items = [
    { id: 'sidebar-text', type: 'text', label: 'Text Block', icon: Type },
    { id: 'sidebar-image', type: 'image', label: 'Image', icon: Image },
    { id: 'sidebar-table', type: 'table', label: 'Table', icon: Table },
    { id: 'sidebar-divider', type: 'divider', label: 'Divider', icon: Minus },
    { id: 'sidebar-spacer', type: 'spacer', label: 'Spacer', icon: MoveVertical },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col gap-4 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Elements</h3>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <DraggableItem key={item.id} {...item} />
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Templates</h3>
        <p className="text-xs text-gray-500">Pre-built templates coming soon.</p>
      </div>
    </div>
  );
}
