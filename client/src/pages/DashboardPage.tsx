import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, CheckCircle2, XCircle, Plus, Clock, Play, ArrowUpRight, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { t, language } = useAuthStore();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testsApi.getAll(1, 10).then(r => { setTests(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: t('totalTests'), value: tests.length, icon: FlaskConical, iconColor: '#a78bfa', accentRgba: '139, 92, 246' },
    { label: t('passRate'), value: tests.length ? Math.round((tests.filter(t => t.status === 'Passed').length / tests.length) * 100) + '%' : '0%', icon: TrendingUp, iconColor: '#818cf8', accentRgba: '99, 102, 241' },
    { label: t('passed'), value: tests.filter(t => t.status === 'Passed').length, icon: CheckCircle2, iconColor: '#6ee7b7', accentRgba: '16, 185, 129' },
    { label: t('failed'), value: tests.filter(t => t.status === 'Failed').length, icon: XCircle, iconColor: '#fca5a5', accentRgba: '239, 68, 68' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Passed': return { bg: 'var(--badge-pass-bg)', color: 'var(--badge-pass-text)', border: 'var(--badge-pass-border)' };
      case 'Failed': return { bg: 'var(--badge-fail-bg)', color: 'var(--badge-fail-text)', border: 'var(--badge-fail-border)' };
      case 'Running': return { bg: 'var(--badge-run-bg)', color: 'var(--badge-run-text)', border: 'var(--badge-run-border)' };
      default: return { bg: 'var(--badge-pending-bg)', color: 'var(--badge-pending-text)', border: 'var(--badge-pending-border)' };
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>

      {/* ─── Page Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {t('dashboard')}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            {language === 'ar' ? 'نظرة عامة على اختباراتك ومساحة العمل' : 'Overview of your testing workspace'}
          </p>
        </div>
        <button
          onClick={() => navigate('/new-test')}
          className="login-submit"
          style={{ width: 'auto', padding: '12px 24px', fontSize: '14px', marginTop: 0 }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>{t('newTest')}</span>
        </button>
      </div>

      {/* ─── Stats Cards Grid ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        {stats.map(({ label, value, icon: Icon, iconColor, accentRgba }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: `1px solid rgba(${accentRgba}, 0.12)`,
              padding: '28px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
              transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(${accentRgba}, 0.08)`;
              e.currentTarget.style.borderColor = `rgba(${accentRgba}, 0.25)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = `rgba(${accentRgba}, 0.12)`;
            }}
          >
            {/* Muted label at top */}
            <p style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}>
              {label}
            </p>

            {/* Value + Icon row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <p style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--text-heading)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {value}
              </p>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `rgba(${accentRgba}, 0.1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon style={{ width: '22px', height: '22px', color: iconColor }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Recent Tests Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>
            {t('recentTests')}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {tests.length > 0 && `${tests.length} ${language === 'ar' ? 'اختبار' : 'tests'}`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '80px 32px', textAlign: 'center' }}>
            <div className="animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-glow)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical style={{ width: '24px', height: '24px', color: 'var(--accent)', opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('loading')}</p>
          </div>
        ) : tests.length === 0 ? (
          <div style={{ padding: '80px 32px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'var(--accent-glow)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical style={{ width: '36px', height: '36px', color: 'var(--accent)', opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{t('noData')}</p>
            <button
              onClick={() => navigate('/new-test')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'var(--hover-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t('newTest')}
            </button>
          </div>
        ) : (
          /* Test Rows — Card List style, NOT a dense table */
          <div style={{ padding: '12px 16px' }}>
            {tests.map((test, idx) => {
              const ss = getStatusStyle(test.status);
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.04 * idx }}
                  onClick={() => navigate(test.status === 'Running' ? `/live/${test.id}` : `/report/${test.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    borderBottom: idx < tests.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-surface)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Left: Description + URL */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                      marginBottom: '6px',
                    }}>
                      {test.prompt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink style={{ width: '11px', height: '11px', color: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {test.targetUrl}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status + Duration + Date + Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    {/* Status Badge — translucent */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: ss.bg,
                      color: ss.color,
                      border: `1px solid ${ss.border}`,
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                    }}>
                      {t(`status${test.status}` as any) || test.status}
                    </span>

                    {/* Duration */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '56px' }}>
                      <Clock style={{ width: '12px', height: '12px', color: 'var(--text-secondary)', opacity: 0.6 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {test.durationMs ? `${(test.durationMs / 1000).toFixed(1)}s` : '—'}
                      </span>
                    </div>

                    {/* Date */}
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '80px', textAlign: 'end' }}>
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>

                    {/* Arrow */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--accent-glow)',
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                    }}>
                      {test.status === 'Running'
                        ? <Play style={{ width: '12px', height: '12px', color: 'var(--accent)' }} />
                        : <ArrowUpRight style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
