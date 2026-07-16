import { ConflictException } from '@nestjs/common';
import { Prisma, Role, StockMovementType } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from './stock.service';

describe('StockService', () => {
  const user: AuthUser = {
    id: 'warehouse-1',
    name: 'Warehouse',
    email: 'warehouse@example.com',
    role: Role.almacen,
  };
  const product = {
    id: 'product-1',
    sku: 'SKU-001',
    name: 'Scanner',
    price: new Prisma.Decimal('120.50'),
    cost: new Prisma.Decimal('80.25'),
    stock: 3,
    minStock: 2,
    categoryId: 'category-1',
    supplierId: 'supplier-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
    updatedAt: new Date('2026-07-16T00:00:00.000Z'),
  };
  const movement = {
    id: 'movement-1',
    productId: 'product-1',
    type: StockMovementType.adjustment,
    qty: -2,
    reason: 'Cycle count',
    userId: 'warehouse-1',
    createdAt: new Date('2026-07-16T00:00:00.000Z'),
  };
  const tx = {
    product: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };
  const prisma = {
    product: {
      fields: {
        minStock: 'minStock',
      },
      findMany: jest.fn(),
      count: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  let service: StockService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StockService(prisma);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (client: typeof tx) => unknown) => {
      return callback(tx);
    });
  });

  it('rejects an adjustment that would make stock negative before persisting anything', async () => {
    tx.product.findUnique.mockResolvedValue(product);

    await expect(
      service.createAdjustment(
        {
          productId: 'product-1',
          qty: -4,
          reason: 'Cycle count',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });

  it('creates an adjustment movement after updating stock', async () => {
    tx.product.findUnique.mockResolvedValue(product);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.stockMovement.create.mockResolvedValue(movement);

    await expect(
      service.createAdjustment(
        {
          productId: 'product-1',
          qty: -2,
          reason: ' Cycle count ',
        },
        user,
      ),
    ).resolves.toEqual(movement);

    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product-1', stock: { gte: 2 } },
      data: { stock: { increment: -2 } },
    });
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-1',
        type: StockMovementType.adjustment,
        qty: -2,
        reason: 'Cycle count',
        userId: 'warehouse-1',
      },
    });
  });
});
