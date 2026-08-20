import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DailyReportList.module.css';
import { NavBar } from '../components/NavBar';
import { TextInput } from '../components/TextInput';
import { ChevronRightIcon, CalendarIcon } from '../components/Icon';
import { useTrial } from '../context/TrialContext';
import { api } from '../lib/api';
import { formatShortDate } from '../lib/date';
import type { DailyReport, Paginated } from '../lib/types';

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function DailyReportList() {
  const navigate = useNavigate();
  const { trial, loading } = useTrial();
  const [reports, setReports] = useState<DailyReport[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!trial) {
      navigate('/', { replace: true });
      return;
    }
    api
      .get<Paginated<DailyReport>>(`/trials/${trial.id}/daily-reports?limit=100&offset=0`)
      .then((res) => setReports(res.items))
      .catch(() => setReports([]));
  }, [trial, loading, navigate]);

  const groups = useMemo(() => {
    if (!reports) return [];
    const filtered = query.trim()
      ? reports.filter((r) => formatShortDate(r.reportDate).includes(query.trim()))
      : reports;
    const map = new Map<string, DailyReport[]>();
    for (const r of filtered) {
      const d = new Date(r.reportDate);
      const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [reports, query]);

  if (!trial) return null;

  return (
    <div>
      <NavBar title="일일 리포트" />
      <div className={styles.body}>
        <TextInput
          placeholder="날짜로 검색 (예: 26/08/03)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<CalendarIcon size={18} />}
        />
        {!reports ? (
          <div>불러오는 중...</div>
        ) : groups.length === 0 ? (
          <div className={styles.empty}>아직 측정 기록이 없어요.</div>
        ) : (
          groups.map(([label, items]) => (
            <div className={styles.group} key={label}>
              <span className={styles.groupLabel}>{label}</span>
              <div className={styles.rows}>
                {items.map((r) => (
                  <button className={styles.row} key={r.id} onClick={() => navigate(`/reports/daily/${r.measurementId}`)}>
                    <span className={styles.rowTitle}>{formatShortDate(r.reportDate)} 일일 리포트</span>
                    <div className={styles.rowRight}>
                      {isToday(r.reportDate) && <span className={styles.todayTag}>TODAY</span>}
                      <ChevronRightIcon color="var(--k-30)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
