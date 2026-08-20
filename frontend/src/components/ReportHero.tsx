import type { ReactNode } from 'react';
import styles from './ReportHero.module.css';
import { ClipboardChartIcon } from './Icon';

export function ReportHero({
  eyebrow,
  title,
  subtitle,
  desc,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  desc: string[];
  icon?: ReactNode;
}) {
  return (
    <div className={styles.hero}>
      <div className={styles.left}>
        <div>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        <div className={styles.desc}>
          {desc.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
      <div className={styles.mark} aria-hidden>
        {icon ?? <ClipboardChartIcon size={44} />}
      </div>
    </div>
  );
}
