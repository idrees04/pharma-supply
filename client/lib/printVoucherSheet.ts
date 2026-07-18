/**
 * Print the voucher sheet in-place (no new browser tab).
 * Clones the sheet to document.body and hides everything else during print
 * so content starts at the top of page 1 with no blank pages from dialog chrome.
 */
export function printVoucherSheet(): void {
  const sheet = document.querySelector('.voucher-print-sheet');
  if (!(sheet instanceof HTMLElement)) {
    window.print();
    return;
  }

  document.getElementById('voucher-print-mount')?.remove();
  document.getElementById('voucher-print-runtime-style')?.remove();

  const mount = sheet.cloneNode(true) as HTMLElement;
  mount.id = 'voucher-print-mount';
  mount.classList.add('voucher-print-sheet');

  const style = document.createElement('style');
  style.id = 'voucher-print-runtime-style';
  style.textContent = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        height: auto !important;
        overflow: visible !important;
      }
      body > *:not(#voucher-print-mount):not(#voucher-print-runtime-style) {
        display: none !important;
      }
      #voucher-print-mount {
        display: block !important;
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: #fff !important;
        overflow: visible !important;
      }
      #voucher-print-mount tr,
      #voucher-print-mount thead {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `;

  document.body.appendChild(style);
  document.body.appendChild(mount);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    mount.remove();
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  // Fallback if afterprint does not fire (some browsers)
  window.setTimeout(cleanup, 1500);
}
