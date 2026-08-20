import { useMemo, useState } from 'react';
import styles from './TrendChart.module.css';

export type TrendPoint = { label: string; value: number };
export type TrendSeries = { key: string; label: string; color: string; points: TrendPoint[] };

type Props = {
  title: string;
  series: TrendSeries[];
  unit?: string;
};

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 8;
const PAD_Y = 14;

export function TrendChart({ title, series, unit = '' }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const pointCount = series[0]?.points.length ?? 0;

  const built = useMemo(() => {
    const allValues = series.flatMap((s) => s.points.map((p) => p.value));
    if (allValues.length === 0) return null;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || 1;
    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;
    const step = pointCount > 1 ? innerW / (pointCount - 1) : 0;

    return series.map((s) => {
      const coords = s.points.map((p, i) => ({
        x: PAD_X + step * i,
        y: PAD_Y + innerH - ((p.value - min) / span) * innerH,
      }));
      const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
      return { ...s, coords, path };
    });
  }, [series, pointCount]);

  if (!built || pointCount === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.headerRow}>
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.empty}>아직 데이터가 충분하지 않아요</div>
      </div>
    );
  }

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    built[0].coords.forEach((c, i) => {
      const d = Math.abs(c.x - relX);
      if (d < closestDist) {
        closestDist = d;
        closest = i;
      }
    });
    setHoverIdx(closest);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{title}</span>
        {series.length === 1 && (
          <span className={styles.latest} style={{ color: series[0].color }}>
            {series[0].points[series[0].points.length - 1].value.toFixed(1)}
            {unit}
          </span>
        )}
      </div>
      {series.length > 1 && (
        <div className={styles.legend}>
          {series.map((s) => (
            <span key={s.key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className={styles.svgWrap}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height={HEIGHT}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
          role="img"
          aria-label={`${title} 추이 차트`}
        >
          <line x1={PAD_X} y1={PAD_Y} x2={WIDTH - PAD_X} y2={PAD_Y} stroke="var(--gs-20)" strokeWidth={1} />
          <line
            x1={PAD_X}
            y1={HEIGHT - PAD_Y}
            x2={WIDTH - PAD_X}
            y2={HEIGHT - PAD_Y}
            stroke="var(--gs-20)"
            strokeWidth={1}
          />
          {hoverIdx !== null && (
            <line
              x1={built[0].coords[hoverIdx].x}
              y1={PAD_Y}
              x2={built[0].coords[hoverIdx].x}
              y2={HEIGHT - PAD_Y}
              stroke="var(--gs-30)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
          {built.map((s) => (
            <g key={s.key}>
              <path d={s.path} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {s.coords.map((c, i) =>
                i === s.coords.length - 1 || i === hoverIdx ? (
                  <circle key={i} cx={c.x} cy={c.y} r={i === hoverIdx ? 4 : 3} fill={s.color} />
                ) : null,
              )}
            </g>
          ))}
        </svg>
        {hoverIdx !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(built[0].coords[hoverIdx].x / WIDTH) * 100}%`,
              top: `${(Math.min(...built.map((s) => s.coords[hoverIdx].y)) / HEIGHT) * 100}%`,
            }}
          >
            <div>{series[0].points[hoverIdx].label}</div>
            {built.map((s) => (
              <div key={s.key}>
                {s.label}: {s.points[hoverIdx].value.toFixed(1)}
                {unit}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
