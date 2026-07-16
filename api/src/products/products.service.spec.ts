import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = {
    id: 'product-1',
    sku: 'SKU-001',
    name: 'Scanner',
    price: new Prisma.Decimal('120.50'),
    cost: new Prisma.Decimal('80.25'),
    stock: 4,
    minStock: 5,
    categoryId: 'category-1',
    supplierId: 'supplier-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  };

  const prisma = {
    product: {
      fields: {
        minStock: 'minStock',
      },
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma);
  });

  it('calculates pagination offsets and returns pagination metadata', async () => {
    jest.spyOn(prisma.product, 'findMany').mockReturnValue(Promise.resolve([product]) as never);
    jest.spyOn(prisma.product, 'count').mockReturnValue(Promise.resolve(41) as never);
    jest.spyOn(prisma, '$transaction').mockResolvedValue([[product], 41] as never);

    await expect(service.findAll({ page: 3, limit: 10 })).resolves.toEqual({
      data: [{ ...product, price: '120.5', cost: '80.25' }],
      total: 41,
      page: 3,
      limit: 10,
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
      skip: 20,
      take: 10,
    });
  });

  it('filters low stock products at the Prisma query level', async () => {
    jest.spyOn(prisma.product, 'findMany').mockReturnValue(Promise.resolve([product]) as never);
    jest.spyOn(prisma.product, 'count').mockReturnValue(Promise.resolve(1) as never);
    jest.spyOn(prisma, '$transaction').mockResolvedValue([[product], 1] as never);

    await service.findAll({ page: 1, limit: 20, lowStock: true });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stock: { lte: 'minStock' } },
      }),
    );
    expect(prisma.product.count).toHaveBeenCalledWith({ where: { stock: { lte: 'minStock' } } });
  });

  it('throws conflict when creating a product with a duplicate sku', async () => {
    jest
      .spyOn(prisma.product, 'create')
      .mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.0',
      }) as never);

    await expect(
      service.create({
        sku: 'SKU-001',
        name: 'Scanner',
        price: 120.5,
        cost: 80.25,
        stock: 4,
        minStock: 5,
        categoryId: 'category-1',
        supplierId: 'supplier-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
