import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesPointDto } from './dto/sales-series-point.dto';
import { SalesSeriesQueryDto } from './dto/sales-series-query.dto';
import { TopProductDto } from './dto/top-product.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';

type ProductInfo = { id: string; name: string; sku: string };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(now = new Date()): Promise<DashboardSummaryDto> {
    const startToday = this.startOfUtcDay(now);
    const start7d = this.addUtcDays(startToday, -6);
    const start30d = this.addUtcDays(startToday, -29);
    const [today, last7d, last30d, lowStockCount, productCount, clientCount] = await this.prisma.$transaction([
      this.aggregateSalesFrom(startToday),
      this.aggregateSalesFrom(start7d),
      this.aggregateSalesFrom(start30d),
      this.prisma.product.count({ where: { stock: { lte: this.prisma.product.fields.minStock } } }),
      this.prisma.product.count(),
      this.prisma.client.count(),
    ]);

    return {
      revenueToday: this.decimalToString(today._sum.total),
      revenue7d: this.decimalToString(last7d._sum.total),
      revenue30d: this.decimalToString(last30d._sum.total),
      salesCountToday: today._count._all,
      salesCount7d: last7d._count._all,
      salesCount30d: last30d._count._all,
      lowStockCount,
      productCount,
      clientCount,
    };
  }

  async getTopProducts(query: TopProductsQueryDto): Promise<TopProductDto[]> {
    const from = this.daysBackStart(query.days);
    const grouped = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { createdAt: { gte: from } } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: query.limit,
    });

    if (grouped.length === 0) {
      return [];
    }

    const productIds = grouped.map((item) => item.productId);
    const [products, saleItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true } }),
      this.prisma.saleItem.findMany({
        where: { productId: { in: productIds }, sale: { createdAt: { gte: from } } },
        select: { productId: true, qty: true, unitPrice: true },
      }),
    ]);
    const productsById = new Map(products.map((product: ProductInfo) => [product.id, product]));
    const revenueByProductId = new Map<string, Prisma.Decimal>();

    for (const item of saleItems) {
      const current = revenueByProductId.get(item.productId) ?? new Prisma.Decimal(0);
      revenueByProductId.set(item.productId, current.plus(item.unitPrice.mul(item.qty)));
    }

    return grouped.map((item) => {
      const product = productsById.get(item.productId);

      return {
        productId: item.productId,
        name: product?.name ?? 'Unknown product',
        sku: product?.sku ?? '',
        unitsSold: item._sum.qty ?? 0,
        revenue: this.decimalToString(revenueByProductId.get(item.productId)),
      };
    });
  }

  async getSalesSeries(query: SalesSeriesQueryDto, now = new Date()): Promise<SalesSeriesPointDto[]> {
    const start = this.addUtcDays(this.startOfUtcDay(now), -(query.days - 1));
    const end = this.addUtcDays(this.startOfUtcDay(now), 1);
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const byDate = new Map<string, { revenue: Prisma.Decimal; salesCount: number }>();

    for (const sale of sales) {
      const key = this.formatUtcDate(sale.createdAt);
      const current = byDate.get(key) ?? { revenue: new Prisma.Decimal(0), salesCount: 0 };
      byDate.set(key, { revenue: current.revenue.plus(sale.total), salesCount: current.salesCount + 1 });
    }

    return Array.from({ length: query.days }, (_, index) => {
      const date = this.formatUtcDate(this.addUtcDays(start, index));
      const point = byDate.get(date);

      return {
        date,
        revenue: this.decimalToString(point?.revenue),
        salesCount: point?.salesCount ?? 0,
      };
    });
  }

  private aggregateSalesFrom(from: Date) {
    return this.prisma.sale.aggregate({
      where: { createdAt: { gte: from } },
      _sum: { total: true },
      _count: { _all: true },
    });
  }

  private daysBackStart(days: number) {
    return this.addUtcDays(this.startOfUtcDay(new Date()), -(days - 1));
  }

  private startOfUtcDay(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private addUtcDays(date: Date, days: number) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private formatUtcDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private decimalToString(value?: Prisma.Decimal | null) {
    return (value ?? new Prisma.Decimal(0)).toString();
  }
}
