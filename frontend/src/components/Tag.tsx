import type { ReactNode } from 'react';
import styles from './Tag.module.css';

type Props = {
  variant?: 'primary' | 'secondary' | 'disabled' | 'good' | 'warning';
  size?: 'regular' | 'small';
  icon?: ReactNode;
  children: ReactNode;
};

export function Tag({ variant = 'primary', size = 'regular', icon, children }: Props) {
  const cls = [styles.tag, styles[variant], size === 'small' ? styles.small : ''].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {icon}
      {children}
    </span>
  );
}
