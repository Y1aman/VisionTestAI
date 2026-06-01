import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { authApi } from '../api/client';
import { motion } from 'framer-motion';
import { FlaskConical, Eye, Sparkles, Globe, Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', tenantName: '', preferredLanguage: 'en' });
  const { setAuth, language, setLanguage, t } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = isLogin
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form);
      setAuth(res.data.token, res.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.errorAr || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, en: 'NL to Test', ar: 'من النص إلى الاختبار', descEn: 'Natural language to automated tests', descAr: 'تحويل النصوص إلى اختبارات' },
    { icon: Eye, en: 'Live Stream', ar: 'بث مباشر', descEn: 'Watch tests execute in real-time', descAr: 'شاهد الاختبارات مباشرة' },
    { icon: FlaskConical, en: 'AI Reports', ar: 'تقارير ذكية', descEn: 'Smart AI-powered analysis', descAr: 'تحليل ذكي بالذكاء الاصطناعي' },
  ];

  return (
    <div className="login-page">
      {/* ── Floating Top-Right Controls ── */}
      <div className="login-controls">
        <button
          onClick={toggleTheme}
          className="login-control-btn"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="login-control-btn login-control-btn--lang"
        >
          <Globe className="w-[18px] h-[18px]" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* LEFT COLUMN — Branding & Value Proposition  */}
      {/* ════════════════════════════════════════════ */}
      <div className="login-branding">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="login-branding__inner"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="login-logo"
          >
            <FlaskConical className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="login-branding__title">
            VisionTest AI
          </h1>

          {/* Subtitle */}
          <p className="login-branding__subtitle">
            {language === 'ar'
              ? 'حوّل أوصاف الاختبارات إلى سيناريوهات مؤتمتة مرئية بقوة الذكاء الاصطناعي'
              : 'Transform test descriptions into visual automated scenarios powered by AI'}
          </p>

          {/* Feature Badges */}
          <div className="login-features">
            {features.map(({ icon: Icon, en, ar, descEn, descAr }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                className="login-feature-badge"
              >
                <div className="login-feature-badge__icon">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="login-feature-badge__title">{language === 'ar' ? ar : en}</p>
                  <p className="login-feature-badge__desc">{language === 'ar' ? descAr : descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* RIGHT COLUMN — Authentication Form      */}
      {/* ════════════════════════════════════════ */}
      <div className="login-form-wrapper">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="login-card"
        >
          {/* Mobile-only compact logo */}
          <div className="login-card__mobile-logo">
            <div className="login-logo login-logo--sm">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <span className="login-branding__title login-branding__title--sm">VisionTest AI</span>
          </div>

          {/* Heading */}
          <div className="login-card__header">
            <h2 className="login-card__title">
              {isLogin ? t('loginTitle') : t('registerTitle')}
            </h2>
            <p className="login-card__subtitle">
              {isLogin ? t('loginSubtitle') : t('registerSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <>
                <div className="login-field">
                  <label className="login-label">{t('fullName')}</label>
                  <input
                    type="text"
                    placeholder={t('fullName')}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="login-input"
                  />
                </div>
                <div className="login-field">
                  <label className="login-label">{t('teamName')}</label>
                  <input
                    type="text"
                    placeholder={t('teamName')}
                    value={form.tenantName}
                    onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                    required
                    className="login-input"
                  />
                </div>
              </>
            )}

            <div className="login-field">
              <label className="login-label">{t('email')}</label>
              <input
                type="email"
                placeholder={language === 'ar' ? 'you@example.com' : 'you@example.com'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label className="login-label">{t('password')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="login-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t('login') : t('register')}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="login-card__footer">
            <span>{isLogin ? t('noAccount') : t('haveAccount')}</span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="login-switch-btn"
            >
              {isLogin ? t('register') : t('login')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
