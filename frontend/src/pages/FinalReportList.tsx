import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FinalReportList.module.css';
import { NavBar } from '../components/NavBar';
import { TextInput } from '../components/TextInput';
import { ChevronRightIcon } from '../components/Icon';
import { api } from '../lib/api';
import { formatShortDate } from '../lib/date';
import type { Paginated, Trial } from '../lib/types';

export function FinalReportList() {
  const navigate = useNavigate();
  const [trials, setTrials] = useState<Trial[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get<Paginated<Trial>>('/trials?limit=50&offset=0')
      .then((res) => setTrials(res.items))
      .catch(() => setTrials([]));
  }, []);

  const filtered = useMemo(() => {
    if (!trials) return [];
    if (!query.trim()) return trials;
    return trials.filter((t) => t.title.includes(query.trim()));
  }, [trials, query]);

  return (
    <div>
      <NavBar title="최종 리포트" />
      <div className={styles.body}>
        <TextInput placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        {!trials ? (
          <div>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>아직 테스트가 없어요.</div>
        ) : (
          <div className={styles.list}>
            {filtered.map((t) => {
              const testArm = t.arms.find((a) => a.role === 'TEST');
              return (
                <button className={styles.row} key={t.id} onClick={() => navigate(`/reports/final/${t.id}`)}>
                  <div className={styles.titleRow}>
                    <span className={styles.title}>{t.title}</span>
                    <ChevronRightIcon color="var(--k-30)" />
                  </div>
                  <span className={styles.dateRange}>
                    {formatShortDate(t.startDate)} ~ {formatShortDate(t.endDate)}
                  </span>
                  {testArm?.product && <span className={styles.product}>{testArm.product.name}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
