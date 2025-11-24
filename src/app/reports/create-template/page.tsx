'use client';

import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  arrayMove, 
  sortableKeyboardCoordinates, 
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from '@/components/reports/builder/Sidebar';
import { Canvas } from '@/components/reports/builder/Canvas';
import { PropertyPanel } from '@/components/reports/builder/PropertyPanel';
import { HeaderEditor } from '@/components/reports/builder/HeaderEditor';
import { FooterEditor } from '@/components/reports/builder/FooterEditor';
import { ReportTemplate, ReportElement, ElementType, ReportSection } from '@/types/report';
import { Save, ArrowLeft, FileText, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useUser, useIsAuthenticated, useHasHydrated } from '@/lib/store/auth.store';

const PDFPreviewModal = dynamic(
  () => import('@/components/reports/preview/PDFPreviewModal').then(mod => mod.PDFPreviewModal),
  { ssr: false }
);

export default function CreateTemplatePage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [template, setTemplate] = useState<ReportTemplate>({
    id: uuidv4(),
    name: 'New Report Template',
    pageSize: 'A4',
    orientation: 'portrait',
    header: { height: 60, elements: [] },
    footer: { height: 40, elements: [] },
    body: { height: 0, elements: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Helper to create new element
    const createNewElement = (type: ElementType): ReportElement => ({
      id: uuidv4(),
      type,
      content: type === 'text' ? 'New Text Block' : '',
      style: {
        fontSize: 12,
        color: '#000000',
        textAlign: 'left',
        padding: 10,
        margin: 0,
        width: '100%',
      },
    });

    // Handle dropping sidebar item
    if (active.data.current?.isSidebarItem) {
      const type = active.data.current.type as ElementType;
      const newElement = createNewElement(type);

      // Check where it was dropped
      const isHeader = over.id === 'header-droppable' || template.header.elements.some(e => e.id === over.id);
      const isFooter = over.id === 'footer-droppable' || template.footer.elements.some(e => e.id === over.id);

      if (isHeader) {
        setTemplate(prev => ({
          ...prev,
          header: { ...prev.header, elements: [...prev.header.elements, newElement] }
        }));
      } else if (isFooter) {
        setTemplate(prev => ({
          ...prev,
          footer: { ...prev.footer, elements: [...prev.footer.elements, newElement] }
        }));
      } else {
        // Default to body
        setTemplate(prev => ({
          ...prev,
          body: { ...prev.body, elements: [...prev.body.elements, newElement] }
        }));
      }
      return;
    }

    // Handle reordering
    const findContainer = (id: string) => {
      if (template.header.elements.some(e => e.id === id)) return 'header';
      if (template.footer.elements.some(e => e.id === id)) return 'footer';
      if (template.body.elements.some(e => e.id === id)) return 'body';
      return null;
    };

    const activeContainer = findContainer(active.id as string);
    
    if (activeContainer) {
      const section = activeContainer as 'header' | 'footer' | 'body';
      setTemplate((prev) => {
        const elements = prev[section].elements;
        const oldIndex = elements.findIndex((e) => e.id === active.id);
        const newIndex = elements.findIndex((e) => e.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return {
            ...prev,
            [section]: {
              ...prev[section],
              elements: arrayMove(elements, oldIndex, newIndex),
            },
          };
        }
        return prev;
      });
    }
  };

  const handleElementUpdate = (id: string, updates: Partial<ReportElement>) => {
    // Helper to update element in any section
    const updateInSection = (section: ReportSection) => ({
      ...section,
      elements: section.elements.map((el) => 
        el.id === id ? { ...el, ...updates } : el
      ),
    });

    setTemplate((prev) => ({
      ...prev,
      header: updateInSection(prev.header),
      body: updateInSection(prev.body),
      footer: updateInSection(prev.footer),
    }));
  };

  const handleElementDelete = (id: string) => {
    // Helper to delete from any section
    const deleteFromSection = (section: ReportSection) => ({
      ...section,
      elements: section.elements.filter((el) => el.id !== id),
    });

    setTemplate((prev) => ({
      ...prev,
      header: deleteFromSection(prev.header),
      body: deleteFromSection(prev.body),
      footer: deleteFromSection(prev.footer),
    }));
    
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Find selected element across all sections
  const selectedElement = 
    template.header.elements.find(e => e.id === selectedElementId) ||
    template.body.elements.find(e => e.id === selectedElementId) ||
    template.footer.elements.find(e => e.id === selectedElementId) || null;


  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="font-semibold text-gray-900 border-none focus:ring-0 p-0 text-sm"
              />
              <p className="text-xs text-gray-500">A4 • Portrait</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex flex-col items-center">
              <div className="w-[210mm] bg-white shadow-lg flex flex-col min-h-[297mm]">
                <HeaderEditor 
                  section={template.header} 
                  onChange={(header) => setTemplate(prev => ({ ...prev, header }))}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onDelete={handleElementDelete}
                />
                
                <Canvas 
                  elements={template.body.elements}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onDelete={handleElementDelete}
                />

                <FooterEditor 
                  section={template.footer} 
                  onChange={(footer) => setTemplate(prev => ({ ...prev, footer }))}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onDelete={handleElementDelete}
                />
              </div>
            </div>
          </div>

          <PropertyPanel 
            element={selectedElement} 
            onUpdate={handleElementUpdate} 
          />

          <DragOverlay>
            {activeId ? (
              <div className="p-2 bg-white border border-blue-500 shadow-lg rounded opacity-80">
                Dragging Item
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <PDFPreviewModal 
        template={template} 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
      />
    </div>
  );
}
