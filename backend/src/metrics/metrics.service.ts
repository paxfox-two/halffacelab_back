import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.metric.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }
}
