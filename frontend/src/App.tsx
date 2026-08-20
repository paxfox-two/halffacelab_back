import { Route, Routes, useLocation } from 'react-router-dom';
import styles from './App.module.css';
import { SetupProvider } from './context/SetupContext';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { SetupSearch } from './pages/SetupSearch';
import { Camera } from './pages/Camera';
import { PhotoCheck } from './pages/PhotoCheck';
import { TodayReport } from './pages/TodayReport';
import { DailyReportList } from './pages/DailyReportList';
import { DailyReportDetail } from './pages/DailyReportDetail';
import { FinalReportList } from './pages/FinalReportList';
import { FinalReport } from './pages/FinalReport';
import { TutorialList } from './pages/TutorialList';
import { TutorialCarousel } from './pages/TutorialCarousel';

function App() {
  const location = useLocation();
  // Key by the top-level section only (e.g. "setup"), not the full path —
  // keying by full pathname would remount this wrapper (and everything
  // inside it, including SetupProvider) on every sub-navigation, wiping
  // in-progress state like a just-selected product when going from
  // /setup/search back to /setup.
  const section = location.pathname.split('/')[1] || 'home';
  return (
    <div key={section} className={styles.pageTransition}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route
          path="/setup/*"
          element={
            <SetupProvider>
              <Routes>
                <Route path="/" element={<Setup />} />
                <Route path="search" element={<SetupSearch />} />
              </Routes>
            </SetupProvider>
          }
        />
        <Route path="/measure/camera" element={<Camera />} />
        <Route path="/measure/check" element={<PhotoCheck />} />
        <Route path="/measure/result" element={<TodayReport />} />
        <Route path="/reports/daily" element={<DailyReportList />} />
        <Route path="/reports/daily/:measurementId" element={<DailyReportDetail />} />
        <Route path="/reports/final" element={<FinalReportList />} />
        <Route path="/reports/final/:trialId" element={<FinalReport />} />
        <Route path="/tutorial" element={<TutorialList />} />
        <Route path="/tutorial/:category" element={<TutorialCarousel />} />
      </Routes>
    </div>
  );
}

export default App;
