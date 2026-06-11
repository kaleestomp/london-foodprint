import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppUIProvider } from './context/AppUIContext';
import Page1 from './Page1/Page1';
import './App.css';

const App = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppUIProvider>
        <Routes>
          <Route path="/" element={<Page1 />} />
        </Routes>
      </AppUIProvider>
    </Router>
  );
};

export default App;