import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './FinalReport.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { ReportHero } from '../components/ReportHero';
import { SkinChangeReport } from '../components/SkinChangeReport';
import { LightIcon, FlaskIcon, CameraIcon } from '../components/Icon';
import { Tag } from '../components/Tag';
import { api } from '../lib/api';
import { formatShortDate } from '../lib/date';
import type { DailyReport, Measurement, Paginated, Trial, TrialReport } from '../lib/types';

export function FinalReport() {
  const navigate = useNavigate();
  const { trialId } = useParams();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [reports, setReports] = useState<DailyReport[] | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null);
  const [analysis, setAnalysis] = useState<TrialReport | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trialId) return;
    api
      .get<Trial>(`/trials/${trialId}`)
      .then(setTrial)
      .catch(() => setError('테스트 정보를 불러오지 못했습니다.'));
    api
      .get<Paginated<DailyReport>>(`/trials/${trialId}/daily-reports?limit=100&offset=0`)
      .then((res) => setReports([...res.items].reverse()))
      .catch(() => setReports([]));
    api
      .get<Paginated<Measurement>>(`/trials/${trialId}/measurements?limit=100&offset=0`)
      .then((res) => setMeasurements(res.items))
      .catch(() => setMeasurements([]));
    api
      .post<TrialReport>(`/trials/${trialId}/report/generate`)
      .then(setAnalysis)
      .catch(() => {});
  }, [trialId]);

  if (!trial || !reports || !measurements) {
    return (
      <div>
        <NavBar title="최종 리포트" />
        <div className={styles.body}>{error ?? '불러오는 중...'}</div>
      </div>
    );
  }

  const testArm = trial.arms.find((a) => a.role === 'TEST');
  const goodCount = measurements.filter((m) => m.qualityGrade === 'GOOD').length;
  const goodRatio = measurements.length > 0 ? (goodCount / measurements.length) * 100 : 0;
  const planDays = Math.round(
    (new Date(trial.endDate).getTime() - new Date(trial.startDate).getTime()) / 86400000,
  );

  const result = analysis?.results.find((r) => r.metricId === trial.primaryMetricId);

  return (
    <div>
      <NavBar title="최종 리포트" />
      <div className={styles.body}>
        <ReportHero
          eyebrow=""
          title={trial.title}
          subtitle={testArm?.product?.name ?? '측정 제품'}
          desc={['제품을 사용한 나의 피부에는', '어떤 변화가 있었을까요?']}
          icon={<FlaskIcon size={44} />}
        />

        <div className={styles.qualityCard}>
          <span className="h5">측정 품질</span>
          <div className={styles.qualityRow}>
            <div className={styles.qualityLeft}>
              <LightIcon size={20} />
              <span>촬영 품질 (양호 비율)</span>
            </div>
            <div className={styles.qualityRight} style={{ color: goodRatio >= 70 ? 'var(--g-10)' : 'var(--r-10)' }}>
              <span>{goodRatio.toFixed(1)}%</span>
              <span style={{ fontWeight: 700 }}>{goodRatio >= 70 ? '양호' : '개선 필요'}</span>
            </div>
          </div>
          <div className={styles.qualityRow}>
            <div className={styles.qualityLeft}>
              <CameraIcon size={20} />
              <span>표본 수량</span>
            </div>
            <div className={styles.qualityRight} style={{ color: 'var(--g-10)' }}>
              <span>
                {measurements.length}/{planDays}
              </span>
            </div>
          </div>
        </div>

        {reports.length > 0 && (
          <>
            <div className={styles.metricTabs}>
              <Tag variant="secondary" size="small">
                홍조
              </Tag>
              <Tag variant="disabled" size="small">
                미백
              </Tag>
              <Tag variant="disabled" size="small">
                잡티
              </Tag>
            </div>
            <SkinChangeReport
              trial={trial}
              reports={reports}
              currentIndex={reports.length - 1}
              eyebrow={`${formatShortDate(trial.startDate)} ~ ${formatShortDate(trial.endDate)}`}
              heroTitle=""
              changeVsLabel="첫 측정 대비 변화율"
            />
          </>
        )}

        <div className={styles.summaryCard}>
          <span className={styles.summaryTitle}>결과 요약</span>
          <span className={styles.summaryHeadline}>{analysis?.headline ?? '분석 결과를 준비하고 있어요'}</span>
          {result?.narrative && <span className={styles.summaryNarrative}>{result.narrative}</span>}
          {result && (
            <button className={styles.detailToggle} onClick={() => setShowDetail((v) => !v)}>
              {showDetail ? '상세 통계 숨기기' : '상세 통계 보기'}
            </button>
          )}
          {showDetail && result && (
            <div className={styles.detailStats}>
              <span>판정: {result.verdict}</span>
              <span>표본 수: {result.nObservations ?? '-'}일</span>
              <span>평균 효과(a*): {result.effectMean !== null ? Number(result.effectMean).toFixed(2) : '-'}</span>
              <span>
                95% 신뢰구간:{' '}
                {result.ciLow !== null && result.ciHigh !== null
                  ? `${Number(result.ciLow).toFixed(2)} ~ ${Number(result.ciHigh).toFixed(2)}`
                  : '표본 부족'}
              </span>
              <span>방향 일관성: {result.probDirection !== null ? `${(Number(result.probDirection) * 100).toFixed(0)}%` : '-'}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Button onClick={() => navigate('/')}>홈으로</Button>
      </div>
    </div>
  );
}
