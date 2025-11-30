import React from 'react';
import { ReportElement } from '@/types/report';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic } from 'lucide-react';

interface PropertyPanelProps {
  element: ReportElement | null;
  onUpdate: (id: string, updates: Partial<ReportElement>) => void;
}

export function PropertyPanel({ element, onUpdate }: PropertyPanelProps) {
  if (!element) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <p className="text-gray-400 text-sm">Select an element to edit its properties</p>
      </div>
    );
  }

  const updateStyle = (key: string, value: any) => {
    onUpdate(element.id, {
      style: {
        ...element.style,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Properties</h3>
        <p className="text-xs text-gray-500 mt-1">{element.type} element</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Content Editor */}
        {element.type === 'text' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Content</label>
            <textarea
              value={element.content}
              onChange={(e) => onUpdate(element.id, { content: e.target.value })}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              placeholder="Enter text..."
            />
          </div>
        )}

        {/* Image Editor */}
        {element.type === 'image' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Image Source</label>
              <input
                type="text"
                value={element.content}
                onChange={(e) => onUpdate(element.id, { content: e.target.value })}
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                placeholder="Enter image URL..."
              />
              <div className="text-center text-xs text-gray-500 my-2">- OR -</div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-xs text-gray-500">Click to upload image</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdate(element.id, { content: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Width</label>
              <input
                type="text"
                value={element.style.width || '100%'}
                onChange={(e) => updateStyle('width', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
                placeholder="e.g. 100% or 200px"
              />
            </div>

             <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Alignment</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() => updateStyle('textAlign', align.value)}
                    className={`flex-1 p-1.5 rounded flex justify-center ${element.style.textAlign === align.value ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <align.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Typography */}
        {element.type === 'text' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Typography</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStyle('fontWeight', element.style.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`p-2 rounded border ${element.style.fontWeight === 'bold' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateStyle('fontStyle', element.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`p-2 rounded border ${element.style.fontStyle === 'italic' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Alignment</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                  { value: 'justify', icon: AlignJustify },
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() => updateStyle('textAlign', align.value)}
                    className={`flex-1 p-1.5 rounded flex justify-center ${element.style.textAlign === align.value ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <align.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spacing */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Spacing</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Padding (px)</label>
              <input
                type="number"
                value={element.style.padding || 0}
                onChange={(e) => updateStyle('padding', parseInt(e.target.value))}
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Margin (px)</label>
              <input
                type="number"
                value={element.style.margin || 0}
                onChange={(e) => updateStyle('margin', parseInt(e.target.value))}
                className="w-full p-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
