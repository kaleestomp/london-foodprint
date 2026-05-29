import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AppUIProvider } from './context/AppUIContext';

import Sidebar from './components/Sidebar/Sidebar';
import Sidedraw from './components/Sidedraw/Sidedraw';
import Page1 from './Page1/Page1'; 
import { AuthGate } from './auth/AuthGate';
import { useAuth } from './auth/AuthContext';
import './App.css';

const App = () => {
  const { canAccessApp } = useAuth();

  if (!canAccessApp) {
    return <AuthGate />;
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppUIProvider>
        <div className="app-container">
          <Sidebar />
          <Sidedraw />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Page1 />} />
            </Routes>
          </main>
        </div>
      </AppUIProvider>
    </Router>
  );
};

export default App;