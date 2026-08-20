import styles from './ReportHero.module.css';

export function ReportHero({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string[];
}) {
  return (
    <div className={styles.hero}>
      <div className={styles.left}>
        <div>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.desc}>
          {desc.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
      <div className={styles.mark} aria-hidden>
        <span />
        <span />
      </div>
    </div>
  );
}
