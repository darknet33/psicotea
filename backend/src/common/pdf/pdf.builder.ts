import * as pdfkit from 'pdfkit';

/**
 * `@types/pdfkit` declara el módulo como una instancia (`export = doc`), pero en
 * tiempo de ejecución `require('pdfkit')` devuelve el constructor. Se re-tipa
 * aquí una sola vez para poder instanciarlo.
 */
const PdfDocumentCtor = pdfkit as unknown as new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFKit.PDFDocument;

export interface PdfMeta {
  label: string;
  value: string;
}

export interface PdfSection {
  heading?: string;
  lines: string[];
}

export interface PdfContent {
  title: string;
  subtitle?: string;
  meta?: PdfMeta[];
  sections: PdfSection[];
}

const INK = '#0f172a';
const MUTED = '#475569';
const PRIMARY = '#7c3aed';

/**
 * Limpia caracteres de control que rompen el flujo de texto del PDF pero
 * conserva saltos de línea y tabulaciones.
 */
function sanitize(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ').trim();
}

/** Genera un PDF A4 simple con un formato compartido por informes y resumen público. */
export function buildPdf(content: PdfContent): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PdfDocumentCtor({
      size: 'A4',
      margin: 50,
      info: { Title: content.title },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(20).fillColor(PRIMARY);
    doc.text(sanitize(content.title));

    if (content.subtitle) {
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(11).fillColor(MUTED);
      doc.text(sanitize(content.subtitle));
    }

    if (content.meta?.length) {
      doc.moveDown(0.6);
      for (const item of content.meta) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(INK);
        doc.text(`${sanitize(item.label)}: `, { continued: true });
        doc.font('Helvetica').fillColor(MUTED);
        doc.text(sanitize(item.value));
      }
    }

    doc.moveDown(1);

    for (const section of content.sections) {
      if (section.heading) {
        doc.font('Helvetica-Bold').fontSize(13).fillColor(INK);
        doc.text(sanitize(section.heading));
        doc.moveDown(0.3);
      }

      for (const line of section.lines) {
        doc.font('Helvetica').fontSize(10).fillColor(INK);
        doc.text(sanitize(line), { paragraphGap: 2 });
      }

      doc.moveDown(0.5);
    }

    doc.end();
  });
}
