import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import { AppUIProvider, useAppUI } from './context/AppUIContext';
import { IsMobileProvider } from './context/IsMobileContext';
import { SearchFiltersProvider } from './context/SearchFiltersContext';
import MapPage from './MapPage/MapPage';
import './App.css';

const AppRoutes = () => {
  const { colorMode } = useAppUI();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode);
    window.localStorage.setItem('app-color-mode', colorMode);

    const paperColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-paper-color')
      .trim();

    if (!paperColor) {
      return;
    }

    let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    themeColorMeta.content = paperColor;
  }, [colorMode]);

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
        <SearchFiltersProvider>
          <AppRoutes />
        </SearchFiltersProvider>
      </AppUIProvider>
      </IsMobileProvider>
    </Router>
  );
};

export default App;