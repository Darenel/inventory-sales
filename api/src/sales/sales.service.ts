import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, StockMovementType } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';

type SaleWithItems = Prisma.SaleGetPayload<{ include: { items: true } }>;
type SaleSummary = Prisma.SaleGetPayload<object>;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSaleDto, user: AuthUser) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const productIds = [...new Set(dto.items.map((item) => item.productId))];
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        const productsById = new Map(products.map((product) => [product.id, product]));

        for (const productId of productIds) {
          if (!productsById.has(productId)) {
            throw new NotFoundException('Product not found');
          }
        }

        const qtyByProductId = new Map<string, number>();
        for (const item of dto.items) {
          qtyByProductId.set(item.productId, (qtyByProductId.get(item.productId) ?? 0) + item.qty);
        }

        for (const [productId, qty] of qtyByProductId) {
          const product = productsById.get(productId);

          if (!product) {
            throw new NotFoundException('Product not found');
          }

          if (product.stock < qty) {
            throw new ConflictException(`Insufficient stock for sku ${product.sku}`);
          }
        }

        const total = dto.items.reduce((sum, item) => {
          const product = productsById.get(item.productId);

          if (!product) {
            throw new NotFoundException('Product not found');
          }

          return sum.plus(product.price.mul(item.qty));
        }, new Prisma.Decimal(0));

        const sale = await tx.sale.create({
          data: {
            sellerId: user.id,
            clientId: dto.clientId,
            total,
            items: {
              create: dto.items.map((item) => {
                const product = productsById.get(item.productId);

                if (!product) {
                  throw new NotFoundException('Product not found');
                }

                return {
                  productId: item.productId,
                  qty: item.qty,
                  unitPrice: product.price,
                };
              }),
            },
          },
          include: { items: true },
        });

        for (const [productId, qty] of qtyByProductId) {
          const product = productsById.get(productId);
          const result = await tx.product.updateMany({
            where: { id: productId, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          });

          if (result.count !== 1) {
            throw new ConflictException(`Insufficient stock for sku ${product?.sku ?? productId}`);
          }
        }

        await tx.stockMovement.createMany({
          data: dto.items.map((item) => ({
            productId: item.productId,
            type: StockMovementType.sale,
            qty: -item.qty,
            reason: `Sale ${sale.id}`,
            userId: user.id,
          })),
        });

        return this.serializeSale(sale);
      });
    } catch (error) {
      if (dto.clientId && this.isForeignKeyError(error)) {
        throw new NotFoundException('Client not found');
      }

      throw error;
    }
  }

  async findAll(query: ListSalesQueryDto, user: AuthUser) {
    const { page, limit, skip, take, sortDir } = normalizeListQuery(query);
    const where = this.buildWhere(query, user);
    const sortBy = pickSortBy(query.sortBy, ['createdAt', 'total'], 'createdAt');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      this.prisma.sale.count({ where }),
    ]);

    return { data: data.map((sale) => this.serializeSummary(sale)), total, page, limit };
  }

  async findOne(id: string, user: AuthUser) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        ...(user.role === Role.vendedor ? { sellerId: user.id } : {}),
      },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return this.serializeSale(sale);
  }

  private buildWhere(query: ListSalesQueryDto, user: AuthUser): Prisma.SaleWhereInput {
    const where: Prisma.SaleWhereInput = {};

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (user.role === Role.vendedor) {
      where.sellerId = user.id;
    } else if (query.sellerId) {
      where.sellerId = query.sellerId;
    }

    return where;
  }

  private serializeSummary(sale: SaleSummary) {
    return {
      ...sale,
      total: sale.total.toString(),
    };
  }

  private serializeSale(sale: SaleWithItems) {
    return {
      ...this.serializeSummary(sale),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
      })),
    };
  }

  private isForeignKeyError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
  }
}
