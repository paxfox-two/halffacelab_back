import { ReportHero } from './ReportHero';
import { ComparisonTable } from './ComparisonTable';
import { TrendChart, type TrendPoint } from './TrendChart';
import { formatShortDate } from '../lib/date';
import type { DailyReport, Trial } from '../lib/types';
import styles from './SkinChangeReport.module.css';

function pct(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function sideLabels(trial: Trial) {
  const left = trial.arms.find((a) => a.side === 'LEFT');
  const right = trial.arms.find((a) => a.side === 'RIGHT');
  const roleText = (role?: string) => (role === 'CONTROL' ? '기존 제품' : '신규 제품');
  return {
    leftLabel: `좌측 ${roleText(left?.role)}`,
    rightLabel: `우측 ${roleText(right?.role)}`,
  };
}

export function SkinChangeReport({
  trial,
  reports,
  currentIndex,
  eyebrow,
  heroTitle,
  changeVsLabel,
}: {
  trial: Trial;
  reports: DailyReport[]; // ascending by date
  currentIndex: number;
  eyebrow: string;
  heroTitle: string;
  changeVsLabel: string;
}) {
  const { leftLabel, rightLabel } = sideLabels(trial);
  const current = reports[currentIndex];
  const baseline = reports[0];
  const prev = currentIndex > 0 ? reports[currentIndex - 1] : null;

  const compareAgainst = changeVsLabel.includes('첫') ? (currentIndex > 0 ? baseline : null) : prev;

  const leftPct = pct(
    current?.leftValue !== null && current?.leftValue !== undefined ? Number(current.leftValue) : null,
    compareAgainst?.leftValue !== null && compareAgainst?.leftValue !== undefined ? Number(compareAgainst.leftValue) : null,
  );
  const rightPct = pct(
    current?.rightValue !== null && current?.rightValue !== undefined ? Number(current.rightValue) : null,
    compareAgainst?.rightValue !== null && compareAgainst?.rightValue !== undefined
      ? Number(compareAgainst.rightValue)
      : null,
  );

  const windowStart = Math.max(0, currentIndex - 4);
  const chartSlice = reports.slice(windowStart, currentIndex + 1);
  const leftPoints: TrendPoint[] = chartSlice.map((r) => ({
    label: formatShortDate(r.reportDate),
    value: r.leftValue !== null ? Number(r.leftValue) : 0,
  }));
  const rightPoints: TrendPoint[] = chartSlice.map((r) => ({
    label: formatShortDate(r.reportDate),
    value: r.rightValue !== null ? Number(r.rightValue) : 0,
  }));

  return (
    <>
      {heroTitle && (
        <ReportHero eyebrow={eyebrow} title={heroTitle} desc={['좌우 피부에서', '어떤 변화가 관찰되었을까요?']} />
      )}

      <div className={styles.section}>
        <span className={`h3 ${styles.sectionTitle}`}>{changeVsLabel}</span>
        <ComparisonTable
          title=""
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          rows={[{ label: '홍조', leftPct, rightPct }]}
        />
      </div>

      <div className={styles.section}>
        <span className={`h3 ${styles.sectionTitle}`}>항목별 변화 추이</span>
        <div className={styles.chartCards}>
          <div className={styles.chartCard}>
            <TrendChart
              title={`홍조 변화 추이 (${chartSlice.length}일)`}
              unit=" a*"
              series={[
                { key: 'left', label: leftLabel, color: 'var(--gs-40)', points: leftPoints },
                { key: 'right', label: rightLabel, color: 'var(--b-00)', points: rightPoints },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
