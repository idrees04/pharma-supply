/**
 * Print a specific element in isolation (no new tab), regardless of what page
 * chrome (sidebar, topbar, toolbars) is currently on screen.
 *
 * Generalized from printVoucherSheet.ts: clones the target element to
 * document.body, hides every other top-level sibling during print, then
 * cleans up. Safe to call from any page — it never mutates global CSS or
 * other pages' print behavior.
 */
export function printElement(
  element: HTMLElement | null,
  options?: { mountId?: string; pageMarginMm?: number },
): void {
  if (!element) {
    window.print();
    return;
  }

  const mountId = options?.mountId ?? 'print-isolated-mount';
  const styleId = `${mountId}-style`;
  const marginMm = options?.pageMarginMm ?? 10;

  document.getElementById(mountId)?.remove();
  document.getElementById(styleId)?.remove();

  const mount = element.cloneNode(true) as HTMLElement;
  mount.id = mountId;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @media print {
      @page {
        size: A4 portrait;
        margin: ${marginMm}mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        height: auto !important;
        overflow: visible !important;
      }
      body > *:not(#${mountId}):not(#${styleId}) {
        display: none !important;
      }
      #${mountId} {
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
      #${mountId} tr,
      #${mountId} thead {
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
  window.setTimeout(cleanup, 1500);
}
