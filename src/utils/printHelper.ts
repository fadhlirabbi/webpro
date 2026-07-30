/**
 * Triggers native browser print dialog reliably, even within sandboxed iframes.
 * Creates an isolated, invisible print iframe, populates it with the printable DOM,
 * applies crisp styling, and calls print() directly on the iframe window.
 */
export function triggerNativePrint(elementId: string, docTitle: string = 'Dokumen') {
  const printElement = document.getElementById(elementId);
  if (!printElement) {
    window.focus();
    window.print();
    return;
  }

  // Clone active stylesheets and style tags from parent document
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  // Remove any previously created print iframe
  const existingIframe = document.getElementById('webpro-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'webpro-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.focus();
    window.print();
    return;
  }

  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        ${headStyles}
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 12px;
            color: #0f172a;
            background: #ffffff !important;
          }
          .print\\:hidden { display: none !important; }
        </style>
      </head>
      <body>
        ${printElement.outerHTML}
      </body>
    </html>
  `);
  frameDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error, falling back to window.print():', e);
      window.focus();
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
}
