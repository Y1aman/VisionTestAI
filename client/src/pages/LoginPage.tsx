import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/client';
import { motion } from 'framer-motion';
import { FlaskConical, Eye, Sparkles, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', tenantName: '', preferredLanguage: 'en' });
  const { setAuth, language, setLanguage, t } = useAuthStore();
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

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] bg-grid">
      {/* Left - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-lg">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
            <FlaskConical className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent pb-2">
            VisionTest AI
          </h1>
          <p className="text-2xl text-[var(--text-secondary)] mx-auto mb-16 leading-relaxed">
            {language === 'ar' 
              ? 'حوّل أوصاف الاختبارات إلى سيناريوهات مؤتمتة مرئية بقوة الذكاء الاصطناعي'
              : 'Transform test descriptions into visual automated scenarios powered by AI'}
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Sparkles, en: 'NL to Test', ar: 'من النص إلى الاختبار' },
              { icon: Eye, en: 'Live Stream', ar: 'بث مباشر' },
              { icon: FlaskConical, en: 'AI Reports', ar: 'تقارير ذكية' },
            ].map(({ icon: Icon, en, ar }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-6 text-center border-white/5 bg-white/5">
                <Icon className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
                <p className="text-sm font-medium text-white">{language === 'ar' ? ar : en}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-8 right-8 z-20">
          <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-all border border-white/10 backdrop-blur-md">
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="glass-card p-10">
            <h2 className="text-3xl font-bold mb-3 text-white">{isLogin ? t('loginTitle') : t('registerTitle')}</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">{isLogin ? t('loginSubtitle') : t('registerSubtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <input type="text" placeholder={t('fullName')} value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} required
                    className="input-glass w-full px-5 py-4" />
                  <input type="text" placeholder={t('teamName')} value={form.tenantName}
                    onChange={(e) => setForm({ ...form, tenantName: e.target.value })} required
                    className="input-glass w-full px-5 py-4" />
                </>
              )}
              <input type="email" placeholder={t('email')} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="input-glass w-full px-5 py-4" />
              <input type="password" placeholder={t('password')} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                className="input-glass w-full px-5 py-4" />
              
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 mt-4 text-lg">
                {loading ? '...' : isLogin ? t('login') : t('register')}
              </button>
            </form>

            <p className="text-center mt-8 text-[var(--text-secondary)]">
              {isLogin ? t('noAccount') : t('haveAccount')}{' '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-purple-400 hover:text-purple-300 font-semibold ml-1 transition-colors">
                {isLogin ? t('register') : t('login')}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
