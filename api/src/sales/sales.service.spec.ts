import { ConflictException } from '@nestjs/common';
import { Prisma, Role, StockMovementType } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  const user: AuthUser = {
    id: 'seller-1',
    name: 'Seller',
    email: 'seller@example.com',
    role: Role.vendedor,
  };
  const product = {
    id: 'product-1',
    sku: 'SKU-001',
    name: 'Scanner',
    price: new Prisma.Decimal('120.50'),
    cost: new Prisma.Decimal('80.25'),
    stock: 5,
    minStock: 2,
    categoryId: 'category-1',
    supplierId: 'supplier-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  };
  const sale = {
    id: 'sale-1',
    sellerId: 'seller-1',
    clientId: 'client-1',
    total: new Prisma.Decimal('241.00'),
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    items: [
      {
        id: 'sale-item-1',
        saleId: 'sale-1',
        productId: 'product-1',
        qty: 2,
        unitPrice: new Prisma.Decimal('120.50'),
      },
    ],
  };
  const tx = {
    product: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
    stockMovement: {
      createMany: jest.fn(),
    },
  };
  const prisma = {
    sale: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  let service: SalesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SalesService(prisma);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (client: typeof tx) => unknown) => {
      return callback(tx);
    });
  });

  it('creates a sale from database prices, decrements stock, and writes a stock movement', async () => {
    tx.product.findMany.mockResolvedValue([product]);
    tx.sale.create.mockResolvedValue(sale);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.stockMovement.createMany.mockResolvedValue({ count: 1 });

    await expect(
      service.create(
        {
          clientId: 'client-1',
          items: [{ productId: 'product-1', qty: 2 }],
        },
        user,
      ),
    ).resolves.toEqual({
      ...sale,
      total: '241',
      items: [{ ...sale.items[0], unitPrice: '120.5' }],
    });

    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sellerId: 'seller-1',
          clientId: 'client-1',
          total: new Prisma.Decimal('241'),
          items: {
            create: [{ productId: 'product-1', qty: 2, unitPrice: product.price }],
          },
        }),
        include: { items: true },
      }),
    );
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product-1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.stockMovement.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product-1',
          type: StockMovementType.sale,
          qty: -2,
          reason: 'Sale sale-1',
          userId: 'seller-1',
        },
      ],
    });
  });

  it('rejects insufficient stock before persisting anything', async () => {
    tx.product.findMany.mockResolvedValue([{ ...product, stock: 1 }]);

    await expect(
      service.create(
        {
          items: [{ productId: 'product-1', qty: 2 }],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.sale.create).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.stockMovement.createMany).not.toHaveBeenCalled();
  });

  it('ignores payload prices and uses the product row price', async () => {
    tx.product.findMany.mockResolvedValue([product]);
    tx.sale.create.mockResolvedValue(sale);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.stockMovement.createMany.mockResolvedValue({ count: 1 });

    await service.create(
      {
        items: [{ productId: 'product-1', qty: 2, unitPrice: 1 }],
      } as never,
      user,
    );

    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: new Prisma.Decimal('241'),
          items: {
            create: [{ productId: 'product-1', qty: 2, unitPrice: product.price }],
          },
        }),
      }),
    );
  });

  it('scopes vendedor sales lists to the authenticated seller', async () => {
    jest.spyOn(prisma.sale, 'findMany').mockReturnValue(Promise.resolve([sale]) as never);
    jest.spyOn(prisma.sale, 'count').mockReturnValue(Promise.resolve(1) as never);
    jest.spyOn(prisma, '$transaction').mockResolvedValue([[sale], 1] as never);

    await service.findAll({ page: 1, limit: 20, sellerId: 'seller-2' }, user);

    expect(prisma.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sellerId: 'seller-1' },
      }),
    );
    expect(prisma.sale.count).toHaveBeenCalledWith({ where: { sellerId: 'seller-1' } });
  });
});
