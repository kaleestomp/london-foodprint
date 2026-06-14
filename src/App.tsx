import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppUIProvider } from './context/AppUIContext';
import { SearchFiltersProvider } from './context/SearchFiltersContext';
import Page1 from './Page1/Page1';
import './App.css';

const App = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppUIProvider>
        <SearchFiltersProvider>
          <Routes>
            <Route path="/" element={<Page1 />} />
          </Routes>
        </SearchFiltersProvider>
      </AppUIProvider>
    </Router>
  );
};

export default App;