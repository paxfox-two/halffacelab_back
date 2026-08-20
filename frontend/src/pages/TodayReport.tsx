import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TodayReport.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { SkinChangeReport } from '../components/SkinChangeReport';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import { formatMonthDay } from '../lib/date';
import type { DailyReport, Paginated } from '../lib/types';

export function TodayReport() {
  const navigate = useNavigate();
  const { trial, loading } = useTrial();
  const [reports, setReports] = useState<DailyReport[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!trial) {
      navigate('/', { replace: true });
      return;
    }
    api
      .get<Paginated<DailyReport>>(`/trials/${trial.id}/daily-reports?limit=10&offset=0`)
      .then((res) => setReports([...res.items].reverse()))
      .catch(() => setReports([]));
  }, [trial, loading, navigate]);

  if (!trial) {
    return null;
  }

  return (
    <div>
      <NavBar title="오늘의 리포트" />
      <div className={styles.body}>
        {!reports ? (
          <div>불러오는 중...</div>
        ) : reports.length === 0 ? (
          <div>측정 데이터를 정리하는 중이에요. 잠시 후 홈에서 다시 확인해 주세요.</div>
        ) : (
          <SkinChangeReport
            trial={trial}
            reports={reports}
            currentIndex={reports.length - 1}
            eyebrow={formatMonthDay(reports[reports.length - 1].reportDate)}
            heroTitle="오늘의 피부 변화"
            changeVsLabel="마지막 측정 대비 변화율"
          />
        )}
      </div>
      <div className={styles.footer}>
        <Button onClick={() => navigate('/')}>홈으로</Button>
      </div>
    </div>
  );
}
