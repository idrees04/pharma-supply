import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Renders an HTML element to a multi-page A4 PDF and triggers download.
 * Slices the canvas per page height so continuation pages are not blank (fixes offset-based tiling bugs).
 */
export async function downloadElementAsPdf(element: HTMLElement, fileBaseName: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidthMm = pdfWidth;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  let offsetMm = 0;
  while (offsetMm < imgHeightMm - 0.01) {
    if (offsetMm > 0) {
      pdf.addPage();
    }

    const sliceMm = Math.min(pdfHeight, imgHeightMm - offsetMm);
    const srcY = (offsetMm / imgHeightMm) * canvas.height;
    const srcH = (sliceMm / imgHeightMm) * canvas.height;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.max(1, Math.ceil(srcH));
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const sliceData = pageCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', 0, 0, imgWidthMm, sliceMm);
    offsetMm += sliceMm;
  }

  pdf.save(`${fileBaseName}.pdf`);
}
