export type ElementType = 'text' | 'image' | 'table' | 'divider' | 'spacer';

export interface ReportElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  padding?: number;
  margin?: number;
  width?: string; // percentage or fixed
  height?: string;
}

export interface ReportElement {
  id: string;
  type: ElementType;
  content: string; // For text, it's the text. For image, the URL.
  style: ReportElementStyle;
  label?: string; // For UI display
}

export interface ReportSection {
  height: number; // Height in points or pixels
  elements: ReportElement[];
  backgroundColor?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  pageSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  header: ReportSection;
  footer: ReportSection;
  body: ReportSection;
  createdAt: Date;
  updatedAt: Date;
}
