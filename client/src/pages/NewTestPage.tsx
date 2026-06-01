import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { Sparkles, Globe2, Zap, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewTestPage() {
  const { t, language } = useAuthStore();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const examples = language === 'ar' ? [
    'اختبر تسجيل الدخول ببيانات خاطئة وتحقق من ظهور رسالة خطأ',
    'تحقق أن الصفحة الرئيسية تحمل بشكل صحيح وتعرض القائمة الرئيسية',
    'اختبر عملية البحث عن منتج وتحقق من ظهور النتائج',
    'تحقق من أن نموذج التسجيل يرفض البريد الإلكتروني غير الصحيح',
  ] : [
    'Test login with invalid credentials and verify error message appears',
    'Check that the homepage loads correctly and displays the navigation menu',
    'Test the product search functionality and verify results appear',
    'Verify the registration form rejects invalid email addresses',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !targetUrl.trim()) return;
    setLoading(true);
    try {
      const res = await testsApi.create({ prompt, targetUrl });
      toast.success(language === 'ar' ? 'تم إنشاء الاختبار وبدأ التنفيذ!' : 'Test created and execution started!');
      navigate(`/live/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3.5 text-[var(--text-heading)] tracking-tight">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '14px', background: 'var(--accent-glow)' }}>
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          </div>
          {t('newTest')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2.5 text-base">{t('describeTest')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Form — 3/5 width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="p-7 sm:p-9 space-y-7" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            {/* Target URL */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <Globe2 className="w-3.5 h-3.5" />{t('targetUrl')}
              </label>
              <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required
                placeholder="https://example.com"
                className="login-input w-full text-sm" style={{ padding: '14px 18px' }} />
            </div>

            {/* Prompt */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />{t('describeTest')}
              </label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required rows={8}
                placeholder={t('testPlaceholder')}
                className="login-input w-full resize-none text-sm leading-relaxed" style={{ padding: '14px 18px' }} />
            </div>

            <button type="submit" disabled={loading}
              className="login-submit w-full" style={{ padding: '16px 24px', fontSize: '15px' }}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{t('generateAndRun')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Examples — 2/5 width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="p-7 h-full" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2.5 text-[var(--text-heading)] uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              {language === 'ar' ? 'أمثلة للاختبارات' : 'Example Prompts'}
            </h3>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <button type="button" key={i} onClick={() => setPrompt(ex)}
                  className="w-full text-start p-4 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] leading-relaxed group transition-all duration-200"
                  style={{ borderRadius: '12px', background: 'var(--hover-surface)', border: '1px solid transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--hover-surface)'; }}
                >
                  <span className="opacity-40 group-hover:opacity-60 mr-1.5">→</span> {ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
