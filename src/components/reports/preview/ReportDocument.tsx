import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ReportTemplate, ReportElement } from '@/types/report';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },
  body: {
    flexGrow: 1,
    padding: 20,
  },
});

interface ReportDocumentProps {
  template: ReportTemplate;
}

export const ReportDocument = ({ template }: ReportDocumentProps) => {
  const renderElement = (element: ReportElement) => {
    const style: any = {
      fontSize: element.style.fontSize,
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      color: element.style.color,
      textAlign: element.style.textAlign,
      padding: element.style.padding,
      margin: element.style.margin,
      width: element.style.width,
    };

    switch (element.type) {
      case 'text':
        return <Text style={style}>{element.content}</Text>;
      case 'image':
        // Note: Image requires a valid URL or base64 string
        return element.content ? <Image src={element.content} style={style} /> : <Text style={{ color: '#ccc' }}>[Image]</Text>;
      case 'divider':
        return <View style={{ borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 10 }} />;
      case 'spacer':
        return <View style={{ height: 20 }} />;
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size={template.pageSize} orientation={template.orientation} style={styles.page}>
        {/* Header */}
        <View style={{ height: template.header.height, backgroundColor: template.header.backgroundColor || 'transparent', padding: 20 }}>
           {template.header.elements.length > 0 ? (
             template.header.elements.map((element) => (
               <View key={element.id}>
                 {renderElement(element)}
               </View>
             ))
           ) : (
             <Text style={{ fontSize: 10, color: '#999' }}>Header</Text>
           )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {template.body.elements.map((element) => (
            <View key={element.id}>
              {renderElement(element)}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={{ height: template.footer.height, backgroundColor: template.footer.backgroundColor || 'transparent', padding: 20 }}>
           {template.footer.elements.length > 0 ? (
             template.footer.elements.map((element) => (
               <View key={element.id}>
                 {renderElement(element)}
               </View>
             ))
           ) : (
             <Text style={{ fontSize: 10, color: '#999' }}>Footer</Text>
           )}
        </View>
      </Page>
    </Document>
  );
};
