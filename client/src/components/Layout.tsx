import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, Plus, History, LogOut, Globe, FlaskConical, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, logout, language, setLanguage, t } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/new-test', icon: Plus, label: t('newTest') },
    { to: '/history', icon: History, label: t('history') },
  ];

  const sidebarContent = (mobile: boolean) => (
    <>
      {/* Logo + Toggle / Close */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-4 ${!mobile && collapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            {(mobile || !collapsed) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t('appName')}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{user?.tenantName}</p>
              </motion.div>
            )}
          </div>
          {mobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all"
              title="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            !collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )
          )}
        </div>
        {!mobile && collapsed && (
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
      <nav className={`flex-1 ${!mobile && collapsed ? 'p-3' : 'p-6'} space-y-3`}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            onClick={() => { if (mobile) setMobileOpen(false); }}
            className={({ isActive }) =>
              `flex items-center ${!mobile && collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10 shadow-lg'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
              }`
            }
            title={!mobile && collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {(mobile || !collapsed) && <span className="font-medium text-sm tracking-wide">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`${!mobile && collapsed ? 'p-3' : 'p-6'} border-t border-white/5 space-y-3`}>
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className={`flex items-center ${!mobile && collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} w-full rounded-2xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all text-sm font-medium`}
          title={!mobile && collapsed ? (language === 'en' ? 'العربية' : 'English') : undefined}
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          {(mobile || !collapsed) && <span>{language === 'en' ? 'العربية' : 'English'}</span>}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }}
          className={`flex items-center ${!mobile && collapsed ? 'justify-center px-3 py-4' : 'gap-4 px-5 py-4'} w-full rounded-2xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium`}
          title={!mobile && collapsed ? t('logout') : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(mobile || !collapsed) && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] bg-grid">
      {/* Mobile Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/5 flex items-center px-4 gap-4 z-30 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t('appName')}
          </h1>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#0a0a14]/95 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 shadow-2xl lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={`${collapsed ? 'w-[80px]' : 'w-[280px]'} bg-[#0a0a14]/80 backdrop-blur-xl border-x border-white/5 flex-col flex-shrink-0 z-20 shadow-2xl transition-all duration-300 ease-in-out hidden lg:flex`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 pt-20 lg:pt-8 lg:p-8 xl:p-12 flex flex-col relative z-10 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 w-full max-w-6xl mx-auto">
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
