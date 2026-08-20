import styles from './ComparisonTable.module.css';
import { ChevronUpIcon, ChevronDownIcon, AsteriskIcon } from './Icon';

export type ComparisonRow = { label: string; leftPct: number | null; rightPct: number | null };

function formatPct(v: number | null) {
  if (v === null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

export function ComparisonTable({
  title,
  leftLabel,
  rightLabel,
  rows,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className={styles.card}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {title && <span className="h5">{title}</span>}
        <div className={styles.headerRow}>
          <span className={styles.headerLeft}>{leftLabel}</span>
          <span className={styles.headerRight}>{rightLabel}</span>
        </div>
      </div>
      <div className={styles.table}>
        {rows.map((row) => (
          <div className={styles.row} key={row.label}>
            <div className={styles.cellLeft}>{formatPct(row.leftPct)}</div>
            <div className={styles.cellLabel}>{row.label}</div>
            <div className={styles.cellRight}>
              {formatPct(row.rightPct)}
              {row.rightPct !== null && row.rightPct !== 0 ? (
                row.rightPct > 0 ? (
                  <ChevronUpIcon size={16} color="var(--b-00)" />
                ) : (
                  <ChevronDownIcon size={16} color="var(--b-00)" />
                )
              ) : (
                <AsteriskIcon size={14} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
