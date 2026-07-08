import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import { AppUIProvider, useAppUI } from './context/AppUIContext';
import { SearchFiltersProvider } from './context/SearchFiltersContext';
import MapPage from './MapPage/MapPage';
import './App.css';

const AppRoutes = () => {
  const { colorMode } = useAppUI();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode);
    window.localStorage.setItem('app-color-mode', colorMode);
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
      <AppUIProvider>
        <SearchFiltersProvider>
          <AppRoutes />
        </SearchFiltersProvider>
      </AppUIProvider>
    </Router>
  );
};

export default App;