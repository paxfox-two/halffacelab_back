import { useNavigate } from 'react-router-dom';
import styles from './TutorialList.module.css';
import { NavBar } from '../components/NavBar';
import { FlaskIcon, TubeIcon, PhoneIcon, ChevronRightIcon } from '../components/Icon';
import { TUTORIAL_SECTIONS, type TutorialCategory } from '../lib/tutorialContent';

const ICONS: Record<TutorialCategory, React.ReactNode> = {
  test: <FlaskIcon size={26} />,
  use: <TubeIcon size={26} />,
  camera: <PhoneIcon size={26} />,
};

export function TutorialList() {
  const navigate = useNavigate();
  return (
    <div>
      <NavBar title="튜토리얼" />
      <div className={styles.body}>
        {Object.values(TUTORIAL_SECTIONS).map((section) => (
          <button className={styles.card} key={section.category} onClick={() => navigate(`/tutorial/${section.category}`)}>
            <div className={styles.topRow}>
              <div className={styles.iconBox}>{ICONS[section.category]}</div>
              <ChevronRightIcon color="var(--k-30)" />
            </div>
            <div>
              <div className={`h5 ${styles.title}`}>{section.listTitle}</div>
              <div className={styles.desc}>{section.listDesc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
