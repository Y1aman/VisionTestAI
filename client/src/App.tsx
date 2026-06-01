import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewTestPage from './pages/NewTestPage';
import LiveTestPage from './pages/LiveTestPage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import Layout from './components/Layout';
import { useEffect } from 'react';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const language = useAuthStore((s) => s.language);
  const theme = useThemeStore((s) => s.theme);
  
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Theme is applied via themeStore on init, this keeps React in sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Toaster position={language === 'ar' ? 'top-left' : 'top-right'} toastOptions={{
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
        }
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="new-test" element={<NewTestPage />} />
          <Route path="live/:id" element={<LiveTestPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="report/:id" element={<ReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
