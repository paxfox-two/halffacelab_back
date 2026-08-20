import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  help?: string;
  error?: string;
  icon?: ReactNode;
};

export function TextInput({ label, required, help, error, icon, className, value, ...rest }: Props) {
  const filled = typeof value === 'string' && value.length > 0;
  const cls = [styles.input, icon ? styles.hasIcon : '', filled ? styles.filled : '', error ? styles.error : '', className]
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
      <div className={styles.inputRow}>
        <input className={cls} value={value} {...rest} />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}
