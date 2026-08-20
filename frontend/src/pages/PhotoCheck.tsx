import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './PhotoCheck.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { CheckCircleIcon, LightIcon, FaceIcon, DistanceIcon } from '../components/Icon';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import { dayIndexFor, formatKoreanDate } from '../lib/date';
import type { CheekSample, QualityCheck } from '../lib/faceAnalysis';
import type { Measurement, MetricValueInput, Paginated } from '../lib/types';

type CaptureState = {
  cheeks: CheekSample[];
  quality: QualityCheck;
  capturedAt: string;
  previewImage: string;
};

function qualityGrade(q: QualityCheck): 'GOOD' | 'FAIR' | 'POOR' {
  const passes = [q.lighting === 'good', q.frontal === 'good', q.distance === 'good'].filter(Boolean).length;
  if (passes === 3) return 'GOOD';
  if (passes >= 1) return 'FAIR';
  return 'POOR';
}

function BarRow({ label, icon, pass }: { label: string; icon: React.ReactNode; pass: boolean }) {
  return (
    <div className={styles.qualityRow}>
      <div className={styles.qualityLeft}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={styles.qualityRight}>
        <div className={styles.bars}>
          <div className={styles.bar} style={{ background: '#BA1B23' }} />
          <div className={styles.bar} style={{ background: '#DA1E28' }} />
          <div className={styles.bar} style={{ background: 'linear-gradient(90deg,#DA1E28,#34C759)' }} />
          <div className={styles.bar} style={{ background: pass ? '#34C759' : '#C6C6C6' }} />
          <div className={styles.bar} style={{ background: pass ? '#22A343' : '#C6C6C6' }} />
        </div>
        <CheckCircleIcon color={pass ? '#22A343' : '#C6C6C6'} />
      </div>
    </div>
  );
}

export function PhotoCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trial, metrics, refresh } = useTrial();
  const state = location.state as CaptureState | undefined;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envSimilarity, setEnvSimilarity] = useState<number | null>(null);

  useEffect(() => {
    if (!state) {
      navigate('/measure/camera', { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (!trial || !state) return;
    api
      .get<Paginated<Measurement>>(`/trials/${trial.id}/measurements?limit=1&offset=0`)
      .then((res) => {
        const prev = res.items[0];
        if (!prev) return;
        const prevL = prev.metricValues.length
          ? prev.metricValues.reduce((s, m) => s + Number(m.labL ?? 0), 0) / prev.metricValues.length
          : null;
        const curL = state.cheeks.reduce((s, c) => s + c.labL, 0) / state.cheeks.length;
        if (prevL !== null) {
          const similarity = Math.max(0, Math.min(100, 100 - Math.abs(curL - prevL) * 4));
          setEnvSimilarity(Math.round(similarity * 10) / 10);
        }
      })
      .catch(() => {});
  }, [trial, state]);

  if (!trial || !state) {
    return null;
  }

  const grade = qualityGrade(state.quality);

  const submit = async () => {
    const redness = metrics.find((m) => m.code === 'REDNESS');
    if (!redness) {
      setError('사용 가능한 측정 항목을 찾을 수 없습니다.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const metricValues: MetricValueInput[] = state.cheeks.map((c) => ({
        metricId: redness.id,
        side: c.side,
        region: 'CHEEK',
        value: Math.round(c.labA * 1000) / 1000,
        labL: Math.round(c.labL * 1000) / 1000,
        labA: Math.round(c.labA * 1000) / 1000,
        labB: Math.round(c.labB * 1000) / 1000,
        samplePixels: c.samplePixels,
      }));

      await api.post(`/trials/${trial.id}/measurements`, {
        dayIndex: dayIndexFor(trial.startDate),
        capturedAt: state.capturedAt,
        qualityGrade: grade,
        metrics: metricValues,
      });
      await refresh();
      navigate('/measure/result', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '측정 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <NavBar title="측정 완료" />
      <div className={styles.body}>
        <img className={styles.previewImg} src={state.previewImage} alt="촬영한 사진" />

        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardTitle}>측정 요약</span>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>측정 일시</span>
              <span className={styles.summaryValue}>{formatKoreanDate(state.capturedAt)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>이미지 품질</span>
              <span className={styles.summaryValue} style={{ color: grade === 'GOOD' ? '#22A343' : grade === 'FAIR' ? '#DA1E28' : '#BA1B23' }}>
                {grade === 'GOOD' ? '양호' : grade === 'FAIR' ? '보통' : '미흡'}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>전날 대비 환경 유사도</span>
              <span className={styles.summaryValue}>{envSimilarity !== null ? `${envSimilarity}%` : '첫 측정'}</span>
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>측정 품질</span>
            <BarRow label="조명" icon={<LightIcon size={20} color="#363639" />} pass={state.quality.lighting === 'good'} />
            <BarRow label="정면 각도" icon={<FaceIcon size={20} color="#363639" />} pass={state.quality.frontal === 'good'} />
            <BarRow label="거리" icon={<DistanceIcon size={20} color="#363639" />} pass={state.quality.distance === 'good'} />
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '0 16px', color: '#DA1E28', fontSize: 12 }}>{error}</div>}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={() => navigate('/measure/camera', { replace: true })} disabled={submitting}>
          다시 촬영하기
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? '제출하는 중...' : '오늘의 리포트 확인'}
        </Button>
      </div>
    </div>
  );
}
