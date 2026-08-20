import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: bigint, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        createdByUserId: userId,
        source: 'USER_MANUAL',
      },
    });
  }

  async findAll({ limit, offset }: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);
    return { items, total, limit, offset };
  }

  // Uses the trigram GIN index (idx_products_search) added in the init
  // migration; ILIKE '%term%' + similarity() ranking both benefit from it.
  async search(q: string, limit: number, offset: number) {
    const term = `%${q}%`;
    // Alias every column back to the camelCase shape Prisma's own query
    // builder returns (findMany etc.) — a plain `SELECT *` here would leak
    // raw snake_case column names to API consumers instead.
    const items = await this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        id,
        brand_name AS "brandName",
        name,
        category,
        image_url AS "imageUrl",
        source,
        created_by_user_id AS "createdByUserId",
        is_verified AS "isVerified",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        similarity(coalesce(brand_name, '') || ' ' || name, ${q}) AS rank
      FROM products
      WHERE (coalesce(brand_name, '') || ' ' || name) ILIKE ${term}
      ORDER BY rank DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return { items, limit, offset };
  }

  async findOne(id: bigint) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');
    return product;
  }

  async update(userId: bigint, id: bigint, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (product.createdByUserId !== userId) {
      throw new ForbiddenException('본인이 등록한 제품만 수정할 수 있습니다.');
    }
    return this.prisma.product.update({
      where: { id },
      data: dto satisfies Prisma.ProductUpdateInput,
    });
  }
}
