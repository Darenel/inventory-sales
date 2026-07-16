declare namespace PDFKit {
  type PDFDocument = import('pdfkit');
}

declare module 'pdfkit' {
  import { Readable } from 'stream';

  type TextOptions = {
    width?: number;
    height?: number;
    ellipsis?: boolean;
  };

  class PDFDocument extends Readable {
    y: number;

    constructor(options?: Record<string, unknown>);
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    addPage(options?: Record<string, unknown>): this;
    end(): this;
  }

  export = PDFDocument;
}
