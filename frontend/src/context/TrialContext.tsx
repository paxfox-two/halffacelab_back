import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Metric, Paginated, Trial } from '../lib/types';

type TrialContextValue = {
  trial: Trial | null;
  metrics: Metric[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const TrialContext = createContext<TrialContextValue | null>(null);

export function TrialProvider({ children }: { children: ReactNode }) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [trials, metricList] = await Promise.all([
        api.get<Paginated<Trial>>('/trials?limit=20&offset=0'),
        api.get<Metric[]>('/metrics'),
      ]);
      const running = trials.items.find((t) => t.status === 'RUNNING');
      const latest = running ?? trials.items[0] ?? null;
      setTrial(latest);
      setMetrics(metricList);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <TrialContext.Provider value={{ trial, metrics, loading, error, refresh }}>{children}</TrialContext.Provider>
  );
}

export function useTrial() {
  const ctx = useContext(TrialContext);
  if (!ctx) throw new Error('useTrial must be used within TrialProvider');
  return ctx;
}
