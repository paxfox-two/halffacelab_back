import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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
      return await this.prisma.$transaction(async (tx) => {
        const measurement = await tx.measurement.create({
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

        if (measurement.status === 'SUCCESS') {
          await this.upsertDailyReport(tx, trial, measurement);
        }

        return measurement;
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

  // Rolls the just-submitted measurement's primary-metric readings (left
  // vs right average) into that day's DailyReport, comparing against the
  // most recent prior report to fill in gapDeltaPrev. Runs inline in the
  // same transaction as the measurement write — this is cheap arithmetic
  // over a handful of rows, unlike the trial-level analysis in
  // ReportsService which is deliberately kept separate.
  private async upsertDailyReport(
    tx: Prisma.TransactionClient,
    trial: { id: bigint; startDate: Date; primaryMetricId: number },
    measurement: { id: bigint; dayIndex: number },
  ) {
    const values = await tx.measurementMetric.findMany({
      where: { measurementId: measurement.id, metricId: trial.primaryMetricId },
    });
    if (values.length === 0) return;

    const avg = (side: 'LEFT' | 'RIGHT') => {
      const forSide = values.filter((v) => v.side === side);
      if (forSide.length === 0) return null;
      const sum = forSide.reduce((s, v) => s + Number(v.value), 0);
      return sum / forSide.length;
    };

    const leftValue = avg('LEFT');
    const rightValue = avg('RIGHT');
    const gap =
      leftValue !== null && rightValue !== null ? leftValue - rightValue : null;

    const reportDate = new Date(trial.startDate);
    reportDate.setDate(reportDate.getDate() + measurement.dayIndex);

    const previous = await tx.dailyReport.findFirst({
      where: { trialId: trial.id, reportDate: { lt: reportDate } },
      orderBy: { reportDate: 'desc' },
    });
    const gapDeltaPrev =
      gap !== null && previous?.gap !== null && previous?.gap !== undefined
        ? gap - Number(previous.gap)
        : null;

    const summaryText =
      gap !== null
        ? `오늘 좌우 차이는 ${Math.abs(gap).toFixed(1)} (a*) 입니다.` +
          (gapDeltaPrev !== null
            ? gapDeltaPrev < 0
              ? ' 어제보다 차이가 줄었어요.'
              : gapDeltaPrev > 0
                ? ' 어제보다 차이가 늘었어요.'
                : ' 어제와 비슷해요.'
            : '')
        : null;

    await tx.dailyReport.upsert({
      where: { trialId_reportDate: { trialId: trial.id, reportDate } },
      create: {
        trialId: trial.id,
        measurementId: measurement.id,
        reportDate,
        leftValue,
        rightValue,
        gap,
        gapDeltaPrev,
        summaryText,
      },
      update: {
        measurementId: measurement.id,
        leftValue,
        rightValue,
        gap,
        gapDeltaPrev,
        summaryText,
      },
    });
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
