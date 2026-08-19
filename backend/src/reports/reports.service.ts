import { randomBytes } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TrialsService } from '../trials/trials.service';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';

const CURRENT_MODEL_VERSION = 'n-of-1-bayes-v0';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trialsService: TrialsService,
  ) {}

  async listDailyReports(
    userId: bigint,
    trialId: bigint,
    { limit, offset }: PaginationQueryDto,
  ) {
    await this.trialsService.assertOwnedTrial(userId, trialId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.dailyReport.findMany({
        where: { trialId },
        take: limit,
        skip: offset,
        orderBy: { reportDate: 'desc' },
      }),
      this.prisma.dailyReport.count({ where: { trialId } }),
    ]);
    return { items, total, limit, offset };
  }

  async getTrialReport(userId: bigint, trialId: bigint) {
    await this.trialsService.assertOwnedTrial(userId, trialId);
    const report = await this.prisma.trialReport.findUnique({
      where: { trialId },
      include: { results: true },
    });
    if (!report) {
      throw new NotFoundException(
        '아직 생성된 리포트가 없습니다. report/generate를 먼저 호출하세요.',
      );
    }
    return report;
  }

  // Heavy N-of-1 Bayesian analysis should not run inline on the request
  // thread. This enqueues by writing status=QUEUED; a separate worker
  // process (future: BullMQ consumer) picks it up, runs the model, and
  // writes the result + status=DONE. Keeping the write here and the
  // compute in a worker lets the two scale independently.
  async requestAnalysis(userId: bigint, trialId: bigint) {
    await this.trialsService.assertOwnedTrial(userId, trialId);
    return this.prisma.trialReport.upsert({
      where: { trialId },
      create: {
        trialId,
        modelVersion: CURRENT_MODEL_VERSION,
        status: 'QUEUED',
        shareToken: randomBytes(16).toString('hex'),
      },
      update: {
        status: 'QUEUED',
        modelVersion: CURRENT_MODEL_VERSION,
      },
    });
  }

  async getSharedReport(shareToken: string) {
    const report = await this.prisma.trialReport.findUnique({
      where: { shareToken },
      include: { results: true },
    });
    if (!report || report.status !== 'DONE') {
      throw new NotFoundException('공유된 리포트를 찾을 수 없습니다.');
    }
    return report;
  }
}
