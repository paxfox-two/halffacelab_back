import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App.tsx';
import { TrialProvider } from './context/TrialContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TrialProvider>
        <App />
      </TrialProvider>
    </BrowserRouter>
  </StrictMode>,
);
