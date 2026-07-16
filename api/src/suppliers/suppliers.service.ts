import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListQueryDto } from '../catalog/dto/list-query.dto';
import { normalizeListQuery, pickSortBy } from '../catalog/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListQueryDto) {
    const { page, limit, skip, take, search, sortDir } = normalizeListQuery(query);
    const where: Prisma.SupplierWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};
    const sortBy = pickSortBy(query.sortBy, ['name', 'email', 'createdAt'], 'name');
    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    try {
      return await this.prisma.supplier.create({
        data: {
          ...dto,
          name: dto.name.trim(),
          email: dto.email?.toLowerCase(),
        },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.supplier.update({
        where: { id },
        data: {
          ...dto,
          name: dto.name?.trim(),
          email: dto.email?.toLowerCase(),
        },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const products = await this.prisma.product.count({ where: { supplierId: id } });

    if (products > 0) {
      throw new ConflictException('Supplier has products');
    }

    await this.prisma.supplier.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id }, select: { id: true } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Supplier email already exists');
    }

    throw error;
  }
}
