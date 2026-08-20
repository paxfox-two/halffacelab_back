import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './TutorialCarousel.module.css';
import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { FlaskIcon, TubeIcon, PhoneIcon } from '../components/Icon';
import { TUTORIAL_SECTIONS, type TutorialCategory } from '../lib/tutorialContent';
import { useTrial } from '../context/TrialContext';

const ICONS: Record<TutorialCategory, React.ReactNode> = {
  test: <FlaskIcon size={56} color="var(--k-20)" />,
  use: <TubeIcon size={56} color="var(--k-20)" />,
  camera: <PhoneIcon size={56} color="var(--k-20)" />,
};

export function TutorialCarousel() {
  const navigate = useNavigate();
  const { trial } = useTrial();
  const { category } = useParams<{ category: TutorialCategory }>();
  const section = category ? TUTORIAL_SECTIONS[category] : undefined;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!section) navigate('/tutorial', { replace: true });
  }, [section, navigate]);

  if (!section) return null;

  const isLast = index === section.slides.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate('/');
    } else {
      setIndex((i) => i + 1);
    }
  };

  const startCta = () => {
    if (section.ctaTarget === 'camera') {
      navigate(trial?.status === 'RUNNING' ? '/measure/camera' : '/setup');
    } else {
      navigate('/setup');
    }
  };

  return (
    <div>
      <NavBar title={section.title} hideBack hideClose />
      <div className={styles.body}>
        <div className={styles.placeholder}>{ICONS[section.category]}</div>
        <div className={styles.text}>
          {section.slides[index].segments.map((seg, i) => (
            <span key={i} className={seg.bold ? styles.bold : undefined}>
              {seg.text}
            </span>
          ))}
        </div>
        <div className={styles.dots}>
          {section.slides.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === index ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant={section.twoButtons ? 'secondary' : isLast ? 'primary' : 'secondary'} onClick={goNext}>
          {isLast ? '홈으로' : '다음'}
        </Button>
        {section.twoButtons && (
          <Button disabled={!isLast} onClick={startCta}>
            {section.ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
