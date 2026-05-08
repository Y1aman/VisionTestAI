import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Plus, History, LogOut, Globe, FlaskConical, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, language, setLanguage, t } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/new-test', icon: Plus, label: t('newTest') },
    { to: '/history', icon: History, label: t('history') },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] bg-grid">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-[80px]' : 'w-[280px]'} bg-[#0a0a14]/80 backdrop-blur-xl border-x border-white/5 flex flex-col flex-shrink-0 z-20 shadow-2xl transition-all duration-300 ease-in-out`}
      >
        {/* Logo + Toggle */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-4 ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {t('appName')}
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{user?.tenantName}</p>
                </motion.div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="mt-3 p-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all w-full flex justify-center"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className={`flex-1 ${collapsed ? 'p-3' : 'p-6'} space-y-3`}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10 shadow-lg'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium text-sm tracking-wide">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className={`${collapsed ? 'p-3' : 'p-6'} border-t border-white/5 space-y-3`}>
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`flex items-center ${collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} w-full rounded-2xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all text-sm font-medium`}
            title={collapsed ? (language === 'en' ? 'العربية' : 'English') : undefined}
          >
            <Globe className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{language === 'en' ? 'العربية' : 'English'}</span>}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }}
            className={`flex items-center ${collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} w-full rounded-2xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium`}
            title={collapsed ? t('logout') : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{t('logout')}</span>}
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
