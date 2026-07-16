import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListProductsQueryDto) {
    const { page, limit, skip, take, search, sortDir } = normalizeListQuery(query);
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.lowStock === true) {
      where.stock = { lte: this.prisma.product.fields.minStock };
    }

    const sortBy = pickSortBy(query.sortBy, ['sku', 'name', 'price', 'cost', 'stock', 'minStock', 'createdAt'], 'name');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: data.map((product) => this.serialize(product)), total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.serialize(product);
  }

  async create(dto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          ...dto,
          sku: dto.sku.trim(),
          name: dto.name.trim(),
        },
      });

      return this.serialize(product);
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...dto,
          sku: dto.sku?.trim(),
          name: dto.name?.trim(),
        },
      });

      return this.serialize(product);
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Product sku already exists');
    }

    throw error;
  }

  private serialize(product: {
    id: string;
    sku: string;
    name: string;
    price: Prisma.Decimal;
    cost: Prisma.Decimal;
    stock: number;
    minStock: number;
    categoryId: string;
    supplierId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...product,
      price: product.price.toString(),
      cost: product.cost.toString(),
    };
  }
}
