import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import { Button } from '../components/Button';
import { ChevronRightIcon, ClipboardChartIcon, QuestionBubbleIcon, FlaskIcon } from '../components/Icon';
import { LogoMark } from '../components/LogoMark';
import type { Measurement, Paginated } from '../lib/types';
import { dayIndexFor } from '../lib/date';

export function Home() {
  const { trial, loading, error } = useTrial();
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null);

  useEffect(() => {
    if (!trial || trial.status !== 'RUNNING') {
      setMeasurements(null);
      return;
    }
    api
      .get<Paginated<Measurement>>(`/trials/${trial.id}/measurements?limit=100&offset=0`)
      .then((res) => setMeasurements(res.items))
      .catch(() => setMeasurements([]));
  }, [trial]);

  if (loading) {
    return <div className={styles.page}>불러오는 중...</div>;
  }

  if (error) {
    return <div className={styles.page}>{error}</div>;
  }

  const running = trial?.status === 'RUNNING' ? trial : null;
  const todayDayIndex = running ? dayIndexFor(running.startDate) : 0;
  const measuredToday = measurements?.some((m) => m.dayIndex === todayDayIndex) ?? false;

  const sorted = measurements ? [...measurements].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)) : [];
  const completedCount = sorted.length;
  const lastDate = sorted[0] ? new Date(sorted[0].capturedAt) : null;

  let avgCycle = 0;
  if (sorted.length >= 2) {
    const asc = [...sorted].reverse();
    let totalGap = 0;
    for (let i = 1; i < asc.length; i++) {
      totalGap += (new Date(asc[i].capturedAt).getTime() - new Date(asc[i - 1].capturedAt).getTime()) / 86400000;
    }
    avgCycle = Math.round(totalGap / (asc.length - 1));
  }

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <LogoMark size={48} />
        <div className={styles.bubble}>
          {running ? (measuredToday ? '오늘 측정 완료했어요!' : '잘하고 있어요!') : '반가워요!'}
        </div>
      </div>

      {running ? (
        <div className={styles.mainCard}>
          <div>
            <div className={styles.titleRow}>
              <span className="h2">측정 {todayDayIndex}일차</span>
              <ChevronRightIcon color="var(--gs-30)" />
            </div>
            <div className={styles.subtitle}>{running.title}</div>
          </div>
          <Button
            disabled={measuredToday}
            onClick={() => navigate('/measure/camera')}
          >
            {measuredToday ? '오늘의 측정 완료' : '오늘의 측정 시작하기'}
          </Button>
          <div className={styles.statsRow}>
            <div className={styles.statCol}>
              <span className={styles.statValue}>{String(completedCount).padStart(2, '0')}</span>
              <span className={styles.statLabel}>완료한 측정</span>
            </div>
            <div className={styles.divider} style={{ width: 2, height: 40 }} />
            <div className={styles.statCol}>
              <span>
                <span className={styles.statValue}>{avgCycle}</span>
                <span className={styles.statUnit}>일</span>
              </span>
              <span className={styles.statLabel}>평균 측정주기</span>
            </div>
            <div className={styles.divider} style={{ width: 2, height: 40 }} />
            <div className={styles.statCol}>
              <span>
                <span className={styles.statValue}>{lastDate ? lastDate.getMonth() + 1 : '00'}</span>
                <span className={styles.statUnit}>월</span>{' '}
                <span className={styles.statValue}>{lastDate ? lastDate.getDate() : '00'}</span>
                <span className={styles.statUnit}>일</span>
              </span>
              <span className={styles.statLabel}>마지막 측정</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <span className="h3">아직 등록된 테스트가 없어요</span>
          <span className={styles.navDesc}>제품을 등록하고 좌우 피부 변화를 비교해 보세요.</span>
          <Button onClick={() => navigate('/setup')}>테스트 시작하기</Button>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.navCards}>
        <button className={styles.navCard} onClick={() => navigate('/reports/daily')} disabled={!running}>
          <div className={styles.navIconRow}>
            <div className={styles.navIcon}>
              <ClipboardChartIcon size={30} />
            </div>
            <ChevronRightIcon color="var(--k-30)" />
          </div>
          <div>
            <div className={`h5 ${styles.navTitle}`}>일일 리포트</div>
            <div className={styles.navDesc}>매일의 측정 결과를 확인해 보세요!</div>
          </div>
        </button>

        <div className={`${styles.navCard} ${styles.disabled}`}>
          <div className={styles.navIconRow}>
            <div className={styles.navIcon}>
              <QuestionBubbleIcon size={30} />
            </div>
          </div>
          <div>
            <div className={`h5 ${styles.navTitle}`}>튜토리얼</div>
            <div className={styles.navDesc}>준비 중이에요</div>
          </div>
        </div>

        <button className={styles.navCard} onClick={() => navigate('/reports/final')} disabled={!trial}>
          <div className={styles.navIconRow}>
            <div className={styles.navIcon}>
              <FlaskIcon size={30} />
            </div>
            <ChevronRightIcon color="var(--k-30)" />
          </div>
          <div>
            <div className={`h5 ${styles.navTitle}`}>최종 리포트</div>
            <div className={styles.navDesc}>지금까지 진행한 테스트의 결과를 다시 확인해 보세요!</div>
          </div>
        </button>
      </div>
    </div>
  );
}
