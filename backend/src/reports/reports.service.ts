import { randomBytes } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TrialsService } from '../trials/trials.service';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { Verdict } from '@prisma/client';

const CURRENT_MODEL_VERSION = 'n-of-1-paired-diff-v1';
const MIN_OBSERVATIONS_FOR_CI = 4;
const Z_95 = 1.96;

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

  // Paired-difference analysis over the trial's daily left/right gap
  // series: is the gap between sides reliably different from zero, given
  // the days actually observed? This is deliberately a simple, transparent
  // statistic (mean +/- 1.96*SE, i.e. a normal-approximation 95% CI) rather
  // than a full Bayesian model — real numbers computed from this trial's
  // own measurements every time, never a fixed or random placeholder.
  //
  // This MVP runs the computation synchronously in the request instead of
  // handing it to a worker queue (see README's scaling note) — the paired
  // t-style stats here are cheap; a heavier model would still want the
  // QUEUED/worker split this schema was built for.
  async requestAnalysis(userId: bigint, trialId: bigint) {
    const trial = await this.trialsService.assertOwnedTrial(userId, trialId);

    const dailyReports = await this.prisma.dailyReport.findMany({
      where: { trialId },
      orderBy: { reportDate: 'asc' },
    });
    const gaps = dailyReports
      .map((r) => (r.gap === null ? null : Number(r.gap)))
      .filter((g): g is number => g !== null);

    const n = gaps.length;
    const baselineGap = gaps.length > 0 ? gaps[0] : null;

    let effectMean: number | null = null;
    let ciLow: number | null = null;
    let ciHigh: number | null = null;
    let probDirection: number | null = null;
    let verdict: Verdict = 'INSUFFICIENT_DATA';

    if (n > 0) {
      effectMean = gaps.reduce((s, g) => s + g, 0) / n;
      probDirection =
        gaps.filter((g) => sameDirection(g, effectMean as number)).length / n;

      if (n >= MIN_OBSERVATIONS_FOR_CI) {
        const variance =
          gaps.reduce((s, g) => s + (g - effectMean!) ** 2, 0) / (n - 1);
        const se = Math.sqrt(variance) / Math.sqrt(n);
        const margin = Z_95 * se;
        ciLow = effectMean - margin;
        ciHigh = effectMean + margin;
        verdict =
          effectMean !== 0 && Math.sign(ciLow) === Math.sign(ciHigh)
            ? 'SIGNIFICANT'
            : 'NO_DIFFERENCE';
      }
    }

    const narrative = buildNarrative(
      trial.title,
      effectMean,
      probDirection,
      n,
      verdict,
    );
    const headline = buildHeadline(verdict);

    const upserted = await this.prisma.trialReport.upsert({
      where: { trialId },
      create: {
        trialId,
        modelVersion: CURRENT_MODEL_VERSION,
        status: 'DONE',
        headline,
        shareToken: randomBytes(16).toString('hex'),
        generatedAt: new Date(),
      },
      update: {
        status: 'DONE',
        modelVersion: CURRENT_MODEL_VERSION,
        headline,
        generatedAt: new Date(),
      },
    });

    await this.prisma.reportMetricResult.upsert({
      where: {
        reportId_metricId: {
          reportId: upserted.id,
          metricId: trial.primaryMetricId,
        },
      },
      create: {
        reportId: upserted.id,
        metricId: trial.primaryMetricId,
        verdict,
        baselineGap,
        effectMean,
        ciLow,
        ciHigh,
        probDirection,
        nObservations: n,
        narrative,
      },
      update: {
        verdict,
        baselineGap,
        effectMean,
        ciLow,
        ciHigh,
        probDirection,
        nObservations: n,
        narrative,
      },
    });

    return this.prisma.trialReport.findUnique({
      where: { trialId },
      include: { results: true },
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

function sameDirection(value: number, reference: number): boolean {
  if (reference === 0) return value === 0;
  return Math.sign(value) === Math.sign(reference);
}

function buildHeadline(verdict: Verdict): string {
  if (verdict === 'INSUFFICIENT_DATA') return '아직 데이터가 부족해요';
  if (verdict === 'SIGNIFICANT') return '좌우 피부에 뚜렷한 차이가 나타났어요';
  return '아직 뚜렷한 차이는 나타나지 않았어요';
}

function buildNarrative(
  title: string,
  effectMean: number | null,
  probDirection: number | null,
  n: number,
  verdict: Verdict,
): string {
  if (verdict === 'INSUFFICIENT_DATA' || effectMean === null) {
    return `${title}: 현재까지 ${n}건의 측정이 있습니다. 신뢰할 수 있는 분석을 위해 최소 ${MIN_OBSERVATIONS_FOR_CI}건 이상의 측정이 필요합니다.`;
  }
  const consistency =
    probDirection !== null ? Math.round(probDirection * 100) : null;
  const magnitude = Math.abs(effectMean).toFixed(1);
  const base = `${n}일간의 측정 결과, 좌우 피부의 홍조(a*) 평균 차이는 ${magnitude}였습니다.`;
  const consistencyText =
    consistency !== null
      ? ` 이 차이의 방향은 전체 측정일의 ${consistency}%에서 일관되게 관찰되었습니다.`
      : '';
  const verdictText =
    verdict === 'SIGNIFICANT'
      ? ' 이 차이는 통계적으로 유의미한 수준입니다.'
      : ' 다만 아직 통계적으로 유의미하다고 보기는 어려운 수준입니다.';
  return base + consistencyText + verdictText;
}
