import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Renders an HTML element to a multi-page A4 PDF and triggers download.
 */
export async function downloadElementAsPdf(element: HTMLElement, fileBaseName: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pdfHeight = pdf.internal.pageSize.getHeight();
  let heightLeft = imgHeight;
  let position = 0;
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }
  pdf.save(`${fileBaseName}.pdf`);
}
