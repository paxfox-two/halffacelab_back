import type { InputHTMLAttributes } from 'react';
import styles from './TextInput.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  help?: string;
  error?: string;
};

export function TextInput({ label, required, help, error, className, value, ...rest }: Props) {
  const filled = typeof value === 'string' && value.length > 0;
  const cls = [styles.input, filled ? styles.filled : '', error ? styles.error : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.wrap}>
      {label && (
        <div className={styles.labelRow}>
          <span>{label}</span>
          {required && <span className={styles.required}>*</span>}
        </div>
      )}
      {help && <div className={styles.help}>{help}</div>}
      <input className={cls} value={value} {...rest} />
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}
