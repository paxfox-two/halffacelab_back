import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'regular' | 'small' | 'xs';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'regular',
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: Props) {
  const cls = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
