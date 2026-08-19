import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { isUniqueConstraintError } from '../common/prisma/prisma.utils';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { CreateTrialDto } from './dto/create-trial.dto';
import type { UpdateTrialDto } from './dto/update-trial.dto';

const MIN_DURATION_DAYS = 28;

// DRAFT -> RUNNING -> COMPLETED
//              \-------> ABANDONED
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['RUNNING', 'ABANDONED'],
  RUNNING: ['COMPLETED', 'ABANDONED'],
  COMPLETED: [],
  ABANDONED: [],
};

@Injectable()
export class TrialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: bigint, dto: CreateTrialDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + MIN_DURATION_DAYS);
    if (endDate < minEndDate) {
      throw new BadRequestException(
        `endDate는 최소 startDate + ${MIN_DURATION_DAYS}일 이후여야 합니다.`,
      );
    }

    const metric = await this.prisma.metric.findUnique({
      where: { id: dto.primaryMetricId },
    });
    if (!metric || !metric.isActive) {
      throw new BadRequestException('사용할 수 없는 측정 항목입니다.');
    }

    // Randomize which side (LEFT/RIGHT) gets the TEST arm server-side, and
    // record the seed, so the assignment isn't something the client (or a
    // biased user) can influence — required for the N-of-1 comparison to
    // be meaningful.
    const seed = randomBytes(16).toString('hex');
    const testSide = randomBytes(1)[0] % 2 === 0 ? 'LEFT' : 'RIGHT';
    const controlSide = testSide === 'LEFT' ? 'RIGHT' : 'LEFT';

    try {
      return await this.prisma.trial.create({
        data: {
          userId,
          title: dto.title,
          primaryMetricId: dto.primaryMetricId,
          startDate,
          endDate,
          runInDays: dto.runInDays ?? 7,
          preferredCaptureTime: dto.preferredCaptureTime
            ? new Date(`1970-01-01T${dto.preferredCaptureTime}:00Z`)
            : undefined,
          timezone: dto.timezone ?? 'Asia/Seoul',
          randomizationSeed: seed,
          arms: {
            create: [
              {
                role: 'TEST',
                side: testSide,
                productId: dto.testProductId
                  ? BigInt(dto.testProductId)
                  : undefined,
              },
              {
                role: 'CONTROL',
                side: controlSide,
                productId: dto.controlProductId
                  ? BigInt(dto.controlProductId)
                  : undefined,
              },
            ],
          },
        },
        include: { arms: true },
      });
    } catch (error) {
      // Prisma doesn't know about uq_running_trial (it's a hand-added
      // partial index, not declared in schema.prisma), so it can't resolve
      // an index name and instead reports the underlying column(s).
      if (isUniqueConstraintError(error, 'user_id')) {
        throw new ConflictException(
          '이미 진행 중인 임상이 있습니다. 새 임상은 기존 임상을 완료하거나 중단한 뒤 시작할 수 있습니다.',
        );
      }
      throw error;
    }
  }

  async findAllForUser(userId: bigint, { limit, offset }: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.trial.findMany({
        where: { userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { arms: true, primaryMetric: true },
      }),
      this.prisma.trial.count({ where: { userId } }),
    ]);
    return { items, total, limit, offset };
  }

  // Shared by MeasurementsService / ReportsService so ownership checks stay
  // in one place instead of being re-implemented per module.
  async assertOwnedTrial(userId: bigint, trialId: bigint) {
    const trial = await this.prisma.trial.findUnique({
      where: { id: trialId },
    });
    if (!trial) throw new NotFoundException('임상을 찾을 수 없습니다.');
    if (trial.userId !== userId) {
      throw new ForbiddenException('본인의 임상만 접근할 수 있습니다.');
    }
    return trial;
  }

  async findOne(userId: bigint, trialId: bigint) {
    await this.assertOwnedTrial(userId, trialId);
    return this.prisma.trial.findUnique({
      where: { id: trialId },
      include: { arms: true, primaryMetric: true },
    });
  }

  async update(userId: bigint, trialId: bigint, dto: UpdateTrialDto) {
    const trial = await this.assertOwnedTrial(userId, trialId);

    if (dto.status && dto.status !== trial.status) {
      const allowed = ALLOWED_TRANSITIONS[trial.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `${trial.status} 상태에서 ${dto.status}(으)로 전환할 수 없습니다.`,
        );
      }
    }

    try {
      return await this.prisma.trial.update({
        where: { id: trialId },
        data: {
          title: dto.title,
          status: dto.status,
          completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
        },
      });
    } catch (error) {
      // Prisma doesn't know about uq_running_trial (it's a hand-added
      // partial index, not declared in schema.prisma), so it can't resolve
      // an index name and instead reports the underlying column(s).
      if (isUniqueConstraintError(error, 'user_id')) {
        throw new ConflictException('이미 진행 중인 임상이 있습니다.');
      }
      throw error;
    }
  }

  async lock(userId: bigint, trialId: bigint) {
    const trial = await this.assertOwnedTrial(userId, trialId);
    if (trial.lockedAt) {
      throw new ConflictException('이미 설계가 잠긴 임상입니다.');
    }
    return this.prisma.trial.update({
      where: { id: trialId },
      data: { lockedAt: new Date() },
    });
  }
}
