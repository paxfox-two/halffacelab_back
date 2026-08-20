import { useNavigate } from 'react-router-dom';
import styles from './NavBar.module.css';
import { ChevronLeftIcon, CloseIcon } from './Icon';

type Props = {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  hideBack?: boolean;
  hideClose?: boolean;
};

export function NavBar({ title, onBack, onClose, hideBack, hideClose }: Props) {
  const navigate = useNavigate();
  return (
    <div className={styles.bar}>
      <div className={styles.row}>
        {!hideBack ? (
          <button className={styles.side} onClick={onBack ?? (() => navigate(-1))} aria-label="뒤로">
            <ChevronLeftIcon />
          </button>
        ) : (
          <span className={styles.side} />
        )}
        <span className={styles.title}>{title}</span>
        {!hideClose ? (
          <button className={styles.side} onClick={onClose ?? (() => navigate('/'))} aria-label="닫기">
            <CloseIcon />
          </button>
        ) : (
          <span className={styles.side} />
        )}
      </div>
    </div>
  );
}
