import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';

import { AppUIProvider, useAppUI } from './context/AppUIContext';
import { IsMobileProvider } from './context/IsMobileContext';
import { SearchFiltersProvider } from './context/SearchFiltersContext';
import { CityProvider } from './context/CityContext';
import assignBrowserThemeColor from './utils/browser/assignBrowserThemeColor';
import MapPage from './MapPage/MapPage';
import { useIsMobileCtx } from './context/IsMobileContext';
import './App.css';

const AppRoutes = () => {
  const { darkMode } = useAppUI();
  const isMobile = useIsMobileCtx();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    window.localStorage.setItem('app-color-mode', darkMode ? 'dark' : 'light');
    assignBrowserThemeColor();
  }, [darkMode]);

  if (!isMobile) {
    return (
      <main className="mobile-only-screen" role="status">
        <SmartphoneOutlinedIcon className="mobile-only-screen-icon" aria-hidden="true" />
        <p>This experience is currently available on mobile devices only.</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/:city?" element={<MapPage />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <IsMobileProvider>
        <AppUIProvider>
          <CityProvider>
            <SearchFiltersProvider>
              <AppRoutes />
            </SearchFiltersProvider>
          </CityProvider>
        </AppUIProvider>
      </IsMobileProvider>
    </Router>
  );
};

export default App;