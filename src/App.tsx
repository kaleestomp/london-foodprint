import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import { AppUIProvider, useAppUI } from './context/AppUIContext';
import { IsMobileProvider } from './context/IsMobileContext';
import { SearchFiltersProvider } from './context/SearchFiltersContext';
import { CityProvider } from './context/CityContext';
import assignBrowserThemeColor from './utils/browser/assignBrowserThemeColor';
import MapPage from './MapPage/MapPage';
import './App.css';

const AppRoutes = () => {
  const { darkMode } = useAppUI();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    window.localStorage.setItem('app-color-mode', darkMode ? 'dark' : 'light');
    assignBrowserThemeColor();
  }, [darkMode]);

  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
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