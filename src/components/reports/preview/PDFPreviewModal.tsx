'use client';

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { ReportTemplate } from '@/types/report';
import { ReportDocument } from './ReportDocument';
import { X } from 'lucide-react';

interface PDFPreviewModalProps {
  template: ReportTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFPreviewModal({ template, isOpen, onClose }: PDFPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white w-[90vw] h-[90vh] rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 p-4 bg-gray-100">
          <PDFViewer width="100%" height="100%" className="rounded-lg shadow-sm">
            <ReportDocument template={template} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
