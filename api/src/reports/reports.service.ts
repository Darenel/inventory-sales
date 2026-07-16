import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { buildCsv, CsvValue } from './csv';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';

type ReportResult = { contentType: string; filename: string; body: Buffer | string };
type TableColumn<T> = { header: string; width: number; value: (row: T) => CsvValue };
type SaleItemReportRow = {
  saleId: string;
  createdAt: Date;
  sellerName: string;
  clientName: string;
  productId: string;
  sku: string;
  productName: string;
  qty: number;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};
type StockReportRow = {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  supplierName: string;
  stock: number;
  minStock: number;
  price: Prisma.Decimal;
  cost: Prisma.Decimal;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildSalesReport(query: SalesReportQueryDto, user: AuthUser): Promise<ReportResult> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const rows = await this.findSalesRows(from, to, user);
    const columns: TableColumn<SaleItemReportRow>[] = [
      { header: 'Sale ID', width: 74, value: (row) => row.saleId },
      { header: 'Created At', width: 82, value: (row) => row.createdAt },
      { header: 'Seller', width: 70, value: (row) => row.sellerName },
      { header: 'Client', width: 70, value: (row) => row.clientName },
      { header: 'SKU', width: 58, value: (row) => row.sku },
      { header: 'Product', width: 86, value: (row) => row.productName },
      { header: 'Qty', width: 34, value: (row) => row.qty },
      { header: 'Unit Price', width: 58, value: (row) => this.money(row.unitPrice) },
      { header: 'Line Total', width: 64, value: (row) => this.money(row.lineTotal) },
    ];
    const range = this.rangeLabel(from, to);
    const filename = `sales-${this.filenameDate(from)}_${this.filenameDate(to)}.${query.format}`;

    if (query.format === 'pdf') {
      const total = rows.reduce((sum, row) => sum.plus(row.lineTotal), new Prisma.Decimal(0));
      return {
        contentType: 'application/pdf',
        filename,
        body: await this.buildPdf('Sales Report', range, columns, rows, `Total revenue: ${this.money(total)}`),
      };
    }

    return {
      contentType: 'text/csv; charset=utf-8',
      filename,
      body: buildCsv(
        columns.map((column) => column.header),
        rows.map((row) => columns.map((column) => column.value(row))),
      ),
    };
  }

  async buildStockReport(query: StockReportQueryDto): Promise<ReportResult> {
    const rows = await this.findStockRows();
    const columns: TableColumn<StockReportRow>[] = [
      { header: 'Product ID', width: 74, value: (row) => row.productId },
      { header: 'SKU', width: 58, value: (row) => row.sku },
      { header: 'Name', width: 92, value: (row) => row.name },
      { header: 'Category', width: 70, value: (row) => row.categoryName },
      { header: 'Supplier', width: 70, value: (row) => row.supplierName },
      { header: 'Stock', width: 40, value: (row) => row.stock },
      { header: 'Min', width: 34, value: (row) => row.minStock },
      { header: 'Price', width: 54, value: (row) => this.money(row.price) },
      { header: 'Cost', width: 54, value: (row) => this.money(row.cost) },
    ];
    const filename = `stock-${this.filenameDate(new Date())}.${query.format}`;

    if (query.format === 'pdf') {
      const lowStockCount = rows.filter((row) => row.stock <= row.minStock).length;
      return {
        contentType: 'application/pdf',
        filename,
        body: await this.buildPdf('Stock Report', 'Current inventory', columns, rows, `Low-stock products: ${lowStockCount}`),
      };
    }

    return {
      contentType: 'text/csv; charset=utf-8',
      filename,
      body: buildCsv(
        columns.map((column) => column.header),
        rows.map((row) => columns.map((column) => column.value(row))),
      ),
    };
  }

  private async findSalesRows(from: Date | undefined, to: Date | undefined, user: AuthUser): Promise<SaleItemReportRow[]> {
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
          ...(user.role === Role.vendedor ? { sellerId: user.id } : {}),
        },
      },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        sale: {
          select: {
            id: true,
            createdAt: true,
            seller: { select: { name: true } },
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { sale: { createdAt: 'asc' } },
    });

    return saleItems.map((item) => ({
      saleId: item.sale.id,
      createdAt: item.sale.createdAt,
      sellerName: item.sale.seller.name,
      clientName: item.sale.client?.name ?? '',
      productId: item.product.id,
      sku: item.product.sku,
      productName: item.product.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice.mul(item.qty),
    }));
  }

  private async findStockRows(): Promise<StockReportRow[]> {
    const products = await this.prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      categoryName: product.category.name,
      supplierName: product.supplier.name,
      stock: product.stock,
      minStock: product.minStock,
      price: product.price,
      cost: product.cost,
    }));
  }

  private async buildPdf<T>(
    title: string,
    subtitle: string,
    columns: TableColumn<T>[],
    rows: T[],
    footer: string,
  ): Promise<Buffer> {
    const PDFDocument = require('pdfkit') as typeof import('pdfkit');
    const document = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.fontSize(16).text(title);
    document.moveDown(0.25).fontSize(10).text(subtitle);
    document.moveDown();
    this.writeTableHeader(document, columns);

    for (const row of rows) {
      if (document.y > 535) {
        document.addPage();
        this.writeTableHeader(document, columns);
      }

      this.writeTableRow(document, columns.map((column) => column.value(row)), columns);
    }

    document.moveDown().fontSize(10).text(footer);
    document.end();

    return new Promise((resolve) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private writeTableHeader<T>(document: PDFKit.PDFDocument, columns: TableColumn<T>[]) {
    document.fontSize(8);
    this.writeTableRow(
      document,
      columns.map((column) => column.header),
      columns,
    );
    document.moveTo(36, document.y).lineTo(806, document.y).stroke();
  }

  private writeTableRow<T>(document: PDFKit.PDFDocument, values: CsvValue[], columns: TableColumn<T>[]) {
    const y = document.y + 4;
    let x = 36;

    for (let index = 0; index < columns.length; index += 1) {
      document.text(this.pdfValue(values[index]), x, y, { width: columns[index].width, height: 22, ellipsis: true });
      x += columns[index].width;
    }

    document.y = y + 22;
  }

  private pdfValue(value: CsvValue) {
    if (value === null || value === undefined) {
      return '';
    }

    return value instanceof Date ? value.toISOString() : String(value);
  }

  private rangeLabel(from: Date | undefined, to: Date | undefined) {
    return `Date range: ${this.filenameDate(from)} to ${this.filenameDate(to)}`;
  }

  private filenameDate(date: Date | undefined) {
    return (date ?? new Date()).toISOString().slice(0, 10);
  }

  private money(value: Prisma.Decimal) {
    return value.toString();
  }
}
