import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Plus, History, LogOut, Globe, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout() {
  const { user, logout, language, setLanguage, t } = useAuthStore();
  const navigate = useNavigate();

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/new-test', icon: Plus, label: t('newTest') },
    { to: '/history', icon: History, label: t('history') },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] bg-grid">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#0a0a14]/80 backdrop-blur-xl border-x border-white/5 flex flex-col flex-shrink-0 z-20 shadow-2xl">
        {/* Logo */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('appName')}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{user?.tenantName}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-6 space-y-3">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10 shadow-lg'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                }`
              }>
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm tracking-wide">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-6 border-t border-white/5 space-y-4">
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <Globe className="w-5 h-5" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium">
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-8 lg:p-12 flex flex-col relative z-10 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 w-full max-w-6xl mx-auto">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
