import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdjustment(dto: CreateStockAdjustmentDto, user: AuthUser) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock + dto.qty < 0) {
        throw new ConflictException(`Insufficient stock for sku ${product.sku}`);
      }

      const result = await tx.product.updateMany({
        where: {
          id: dto.productId,
          ...(dto.qty < 0 ? { stock: { gte: Math.abs(dto.qty) } } : {}),
        },
        data: { stock: { increment: dto.qty } },
      });

      if (result.count !== 1) {
        throw new ConflictException(`Insufficient stock for sku ${product.sku}`);
      }

      return tx.stockMovement.create({
        data: {
          productId: dto.productId,
          type: StockMovementType.adjustment,
          qty: dto.qty,
          reason: dto.reason.trim(),
          userId: user.id,
        },
      });
    });
  }

  async findMovements(query: ListStockMovementsQueryDto) {
    const { page, limit, skip, take, sortDir } = normalizeListQuery(query);
    const where: Prisma.StockMovementWhereInput = {
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const sortBy = pickSortBy(query.sortBy, ['createdAt', 'qty'], 'createdAt');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAlerts() {
    const where = { stock: { lte: this.prisma.product.fields.minStock } };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' } }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((product) => ({
        ...product,
        price: product.price.toString(),
        cost: product.cost.toString(),
      })),
      total,
    };
  }
}
