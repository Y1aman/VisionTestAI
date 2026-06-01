import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { LayoutDashboard, Plus, History, LogOut, Globe, FlaskConical, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function Layout() {
  const { user, logout, language, setLanguage, t } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const handleNav = (to: string) => {
    closeDrawer();
    navigate(to);
  };

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/new-test', icon: Plus, label: t('newTest') },
    { to: '/history', icon: History, label: t('history') },
  ];

  /* ─── Desktop Icon Rail (always visible on lg+) ─── */
  const iconRail = (
    <aside
      style={{
        width: '72px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 20,
        paddingTop: '20px',
        paddingBottom: '16px',
        transition: 'all 0.3s ease',
      }}
      className="hidden lg:flex"
    >
      {/* Logo — click to toggle drawer */}
      <button
        onClick={openDrawer}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
          marginBottom: '28px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(139, 92, 246, 0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.25)'; }}
        title="Open sidebar"
      >
        <FlaskConical style={{ width: '20px', height: '20px', color: 'white' }} />
      </button>

      {/* Nav Icons */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: '0 12px' }}>
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <button
              key={to}
              onClick={() => handleNav(to)}
              title={label}
              style={{
                width: '100%',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: isActive ? '1px solid var(--active-nav-border)' : '1px solid transparent',
                background: isActive ? 'var(--active-nav-from)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', padding: '0 12px' }}>
        <button onClick={toggleTheme} title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {theme === 'dark' ? <Sun style={{ width: '20px', height: '20px' }} /> : <Moon style={{ width: '20px', height: '20px' }} />}
        </button>
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
        <button onClick={() => { logout(); navigate('/login'); }} title={t('logout')}
          style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--badge-fail-text)', opacity: 0.6, cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--badge-fail-bg)'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.6'; }}
        >
          <LogOut style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </aside>
  );

  /* ─── Full Sidebar Drawer (shared for desktop overlay + mobile) ─── */
  const sidebarDrawer = (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: drawerOpen ? '8px 0 32px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)', flexShrink: 0,
          }}>
            <FlaskConical style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, background: 'linear-gradient(to right, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
              {t('appName')}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.tenantName}
            </p>
          </div>
        </div>
        <button onClick={closeDrawer} title="Close"
          style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <button
              key={to}
              onClick={() => handleNav(to)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: isActive ? '1px solid var(--active-nav-border)' : '1px solid transparent',
                background: isActive ? 'var(--active-nav-from)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Theme */}
        <button onClick={() => { toggleTheme(); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {theme === 'dark' ? <Sun style={{ width: '20px', height: '20px', flexShrink: 0 }} /> : <Moon style={{ width: '20px', height: '20px', flexShrink: 0 }} />}
          <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
        </button>
        {/* Language */}
        <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Globe style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 4px' }} />

        {/* Logout */}
        <button onClick={() => { logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--badge-fail-text)', opacity: 0.7, fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--badge-fail-bg)'; e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
        >
          <LogOut style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );

  /* ─── Backdrop Overlay (shared for desktop + mobile) ─── */
  const backdrop = (
    <div
      onClick={closeDrawer}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 50,
        opacity: drawerOpen ? 1 : 0,
        pointerEvents: drawerOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}
    />
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }} className="bg-grid">

      {/* ─── Mobile Header Bar (visible below lg) ─── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
          zIndex: 30,
        }}
        className="lg:hidden"
      >
        <button onClick={openDrawer} aria-label="Open menu"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Menu style={{ width: '22px', height: '22px' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlaskConical style={{ width: '16px', height: '16px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '16px', fontWeight: 700, background: 'linear-gradient(to right, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('appName')}
          </h1>
        </div>
        <button onClick={toggleTheme} aria-label="Toggle theme"
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: 'none', background: 'var(--hover-surface)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          {theme === 'dark' ? <Sun style={{ width: '16px', height: '16px' }} /> : <Moon style={{ width: '16px', height: '16px' }} />}
        </button>
      </header>

      {/* ─── Desktop Icon Rail ─── */}
      {iconRail}

      {/* ─── Backdrop (desktop + mobile) ─── */}
      {backdrop}

      {/* ─── Full Sidebar Drawer (desktop + mobile) ─── */}
      {sidebarDrawer}

      {/* ─── Main Content ─── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: '24px',
          paddingTop: '80px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10,
          overflowX: 'hidden',
        }}
        className="lg:pt-10 lg:p-10 xl:p-12"
      >
        <div style={{ flex: 1, width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
