import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './TodayReport.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { SkinChangeReport } from '../components/SkinChangeReport';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import { formatMonthDay } from '../lib/date';
import type { DailyReport, Paginated } from '../lib/types';

export function DailyReportDetail() {
  const navigate = useNavigate();
  const { measurementId } = useParams();
  const { trial, loading } = useTrial();
  const [reports, setReports] = useState<DailyReport[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!trial) {
      navigate('/', { replace: true });
      return;
    }
    api
      .get<Paginated<DailyReport>>(`/trials/${trial.id}/daily-reports?limit=100&offset=0`)
      .then((res) => setReports([...res.items].reverse()))
      .catch(() => setReports([]));
  }, [trial, loading, navigate]);

  if (!trial) return null;

  const index = reports?.findIndex((r) => r.measurementId === measurementId) ?? -1;
  const current = index >= 0 ? reports![index] : null;

  return (
    <div>
      <NavBar title={current ? `${formatMonthDay(current.reportDate)} 리포트` : '일일 리포트'} />
      <div className={styles.body}>
        {!reports ? (
          <div>불러오는 중...</div>
        ) : !current ? (
          <div>해당 리포트를 찾을 수 없어요.</div>
        ) : (
          <SkinChangeReport
            trial={trial}
            reports={reports}
            currentIndex={index}
            eyebrow={formatMonthDay(current.reportDate)}
            heroTitle="그날의 피부 변화"
            changeVsLabel="이전 측정 대비 변화율"
          />
        )}
      </div>
      <div className={styles.footer}>
        <Button onClick={() => navigate('/reports/daily')}>완료</Button>
      </div>
    </div>
  );
}
