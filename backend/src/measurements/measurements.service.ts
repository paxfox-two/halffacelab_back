import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { isUniqueConstraintError } from '../common/prisma/prisma.utils';
import { TrialsService } from '../trials/trials.service';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { CreateMeasurementDto } from './dto/create-measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trialsService: TrialsService,
  ) {}

  async create(userId: bigint, trialId: bigint, dto: CreateMeasurementDto) {
    const trial = await this.trialsService.assertOwnedTrial(userId, trialId);
    if (trial.status !== 'RUNNING') {
      throw new BadRequestException(
        '진행 중(RUNNING)인 임상에만 측정을 제출할 수 있습니다.',
      );
    }

    try {
      return await this.prisma.measurement.create({
        data: {
          trialId,
          dayIndex: dto.dayIndex,
          capturedAt: new Date(dto.capturedAt),
          status: dto.status ?? 'SUCCESS',
          qualityGrade: dto.qualityGrade,
          rejectReason: dto.rejectReason,
          deviceModel: dto.deviceModel,
          ambientLux: dto.ambientLux,
          whiteBalanceK: dto.whiteBalanceK,
          exposureEv: dto.exposureEv,
          faceYaw: dto.faceYaw,
          facePitch: dto.facePitch,
          faceRoll: dto.faceRoll,
          distanceMm: dto.distanceMm,
          metricValues: {
            create: dto.metrics.map((m) => ({
              metricId: m.metricId,
              side: m.side,
              region: m.region ?? 'CHEEK',
              value: m.value,
              labL: m.labL,
              labA: m.labA,
              labB: m.labB,
              samplePixels: m.samplePixels,
            })),
          },
        },
        include: { metricValues: true },
      });
    } catch (error) {
      // Same situation as uq_running_trial: this partial index isn't in
      // schema.prisma, so Prisma reports it by column rather than name.
      if (isUniqueConstraintError(error, 'day_index')) {
        throw new ConflictException('오늘의 측정을 이미 제출했습니다.');
      }
      throw error;
    }
  }

  async findAllForTrial(
    userId: bigint,
    trialId: bigint,
    { limit, offset }: PaginationQueryDto,
  ) {
    await this.trialsService.assertOwnedTrial(userId, trialId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.measurement.findMany({
        where: { trialId },
        take: limit,
        skip: offset,
        orderBy: { capturedAt: 'desc' },
        include: { metricValues: true },
      }),
      this.prisma.measurement.count({ where: { trialId } }),
    ]);
    return { items, total, limit, offset };
  }
}
