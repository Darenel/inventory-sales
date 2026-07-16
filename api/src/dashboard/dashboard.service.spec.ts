import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    sale: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    saleItem: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      fields: {
        minStock: 'minStock',
      },
      count: jest.fn(),
      findMany: jest.fn(),
    },
    client: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma);
  });

  it('maps summary sales aggregations and inventory counts', async () => {
    const today = { _sum: { total: new Prisma.Decimal('100.50') }, _count: { _all: 2 } };
    const last7d = { _sum: { total: new Prisma.Decimal('700.75') }, _count: { _all: 8 } };
    const last30d = { _sum: { total: null }, _count: { _all: 0 } };

    jest.spyOn(prisma.sale, 'aggregate').mockReturnValue(Promise.resolve(today) as never);
    jest.spyOn(prisma.product, 'count').mockReturnValue(Promise.resolve(3) as never);
    jest.spyOn(prisma.client, 'count').mockReturnValue(Promise.resolve(11) as never);
    jest.spyOn(prisma, '$transaction').mockResolvedValue([today, last7d, last30d, 4, 25, 11] as never);

    await expect(service.getSummary(new Date('2026-07-16T18:30:00.000Z'))).resolves.toEqual({
      revenueToday: '100.5',
      revenue7d: '700.75',
      revenue30d: '0',
      salesCountToday: 2,
      salesCount7d: 8,
      salesCount30d: 0,
      lowStockCount: 4,
      productCount: 25,
      clientCount: 11,
    });

    expect(prisma.sale.aggregate).toHaveBeenNthCalledWith(1, {
      where: { createdAt: { gte: new Date('2026-07-16T00:00:00.000Z') } },
      _sum: { total: true },
      _count: { _all: true },
    });
    expect(prisma.sale.aggregate).toHaveBeenNthCalledWith(2, {
      where: { createdAt: { gte: new Date('2026-07-10T00:00:00.000Z') } },
      _sum: { total: true },
      _count: { _all: true },
    });
    expect(prisma.product.count).toHaveBeenCalledWith({ where: { stock: { lte: 'minStock' } } });
  });

  it('fills missing UTC days in the sales series', async () => {
    jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([
      { createdAt: new Date('2026-07-14T23:30:00.000Z'), total: new Prisma.Decimal('12.25') },
      { createdAt: new Date('2026-07-16T01:00:00.000Z'), total: new Prisma.Decimal('5.75') },
      { createdAt: new Date('2026-07-16T10:00:00.000Z'), total: new Prisma.Decimal('2.00') },
    ] as never);

    await expect(service.getSalesSeries({ days: 3 }, new Date('2026-07-16T12:00:00.000Z'))).resolves.toEqual([
      { date: '2026-07-14', revenue: '12.25', salesCount: 1 },
      { date: '2026-07-15', revenue: '0', salesCount: 0 },
      { date: '2026-07-16', revenue: '7.75', salesCount: 2 },
    ]);

    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-07-14T00:00:00.000Z'),
          lt: new Date('2026-07-17T00:00:00.000Z'),
        },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  });
});
