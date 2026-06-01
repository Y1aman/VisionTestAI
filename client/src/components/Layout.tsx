import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { LayoutDashboard, Plus, History, LogOut, Globe, FlaskConical, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const RAIL_WIDTH = 72;
const MOBILE_HEADER_HEIGHT = 56;
const BREAKPOINT = 768; // md breakpoint

export default function Layout() {
  const { user, logout, language, setLanguage, t } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);

  // Track viewport size
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location]);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleNav = (to: string) => { closeDrawer(); navigate(to); };

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/new-test', icon: Plus, label: t('newTest') },
    { to: '/history', icon: History, label: t('history') },
  ];

  /* ═══════════════════════════════════════════════════════════
     SHARED: Bottom utility buttons (theme, language, logout)
     ═══════════════════════════════════════════════════════════ */
  const bottomActionsIcon = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', padding: '0 12px', marginTop: 'auto', flexShrink: 0 }}>
      <button onClick={toggleTheme} title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        style={btnIconStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} title={language === 'en' ? 'العربية' : 'English'}
        style={btnIconStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Globe size={20} />
      </button>
      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
      <button onClick={() => { logout(); navigate('/login'); }} title={t('logout')}
        style={{ ...btnIconStyle, color: 'var(--badge-fail-text)', opacity: 0.6 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--badge-fail-bg)'; e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.6'; }}
      >
        <LogOut size={20} />
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }} className="bg-grid">

      {/* ─── MOBILE HEADER (only on mobile) ─── */}
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: `${MOBILE_HEADER_HEIGHT}px`,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: '12px',
          zIndex: 35,
        }}>
          <button onClick={openDrawer} aria-label="Open menu"
            style={{ ...btnIconStyle, width: '40px', height: '40px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={logoSmallStyle}>
              <FlaskConical size={16} color="white" />
            </div>
            <h1 style={appNameStyle}>{t('appName')}</h1>
          </div>
        </header>
      )}

      {/* ─── DESKTOP ICON RAIL (only on desktop) ─── */}
      {!isMobile && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: `${RAIL_WIDTH}px`,
          height: '100vh',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          zIndex: 30,
          paddingTop: '24px', paddingBottom: '16px',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <button onClick={openDrawer} title="Open sidebar"
            style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: 'none', flexShrink: 0,
              marginBottom: '24px',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <FlaskConical size={18} color="white" />
          </button>

          {/* Nav Icons */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: '0 14px' }}>
            {links.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return (
                <button key={to} onClick={() => handleNav(to)} title={label}
                  style={{
                    width: '100%', height: '44px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '12px',
                    border: isActive ? '1px solid var(--active-nav-border)' : '1px solid transparent',
                    background: isActive ? 'var(--active-nav-from)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </nav>

          {/* Bottom utilities */}
          {bottomActionsIcon}
        </aside>
      )}

      {/* ─── BACKDROP ─── */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          zIndex: 50,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* ─── SIDEBAR DRAWER (shared desktop + mobile) ─── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '280px', height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column',
        zIndex: 60,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: drawerOpen ? '8px 0 32px rgba(0,0,0,0.2)' : 'none',
        overflowY: 'auto',
      }}>
        {/* Drawer Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <FlaskConical size={18} color="white" />
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
            style={{ ...btnIconStyle, width: '36px', height: '36px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <button key={to} onClick={() => handleNav(to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', borderRadius: '12px',
                  border: isActive ? '1px solid var(--active-nav-border)' : '1px solid transparent',
                  background: isActive ? 'var(--active-nav-from)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500, fontSize: '14px',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  width: '100%', textAlign: 'left', letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Drawer Bottom Utilities */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'auto', flexShrink: 0 }}>
          <button onClick={toggleTheme}
            style={btnDrawerStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {theme === 'dark' ? <Sun size={20} style={{ flexShrink: 0 }} /> : <Moon size={20} style={{ flexShrink: 0 }} />}
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            style={btnDrawerStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Globe size={20} style={{ flexShrink: 0 }} />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 4px' }} />
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ ...btnDrawerStyle, color: 'var(--badge-fail-text)', opacity: 0.7 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--badge-fail-bg)'; e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7'; }}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 10,
        overflowX: 'hidden',
        marginLeft: isMobile ? 0 : `${RAIL_WIDTH}px`,
        paddingTop: isMobile ? `${MOBILE_HEADER_HEIGHT + 20}px` : '40px',
        paddingLeft: isMobile ? '20px' : '40px',
        paddingRight: isMobile ? '20px' : '40px',
        paddingBottom: '32px',
      }}>
        <div style={{ flex: 1, width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ─── Shared style objects ─── */
const btnIconStyle: React.CSSProperties = {
  width: '44px', height: '44px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '12px', border: 'none',
  background: 'transparent', color: 'var(--text-secondary)',
  cursor: 'pointer', transition: 'all 0.2s ease',
};

const btnDrawerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '14px',
  padding: '12px 16px', borderRadius: '12px', border: 'none',
  background: 'transparent', color: 'var(--text-secondary)',
  fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', width: '100%', textAlign: 'left',
  transition: 'all 0.2s ease',
};

const logoSmallStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '8px',
  background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const appNameStyle: React.CSSProperties = {
  fontSize: '16px', fontWeight: 700,
  background: 'linear-gradient(to right, #a78bfa, #c084fc)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
};
