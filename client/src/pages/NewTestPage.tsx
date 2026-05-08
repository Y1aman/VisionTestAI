import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { Sparkles, Globe2, Zap, Lightbulb } from 'lucide-react';
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
      toast.success(language === 'ar' ? 'تم إنشاء الاختبار وبدء التنفيذ!' : 'Test created and execution started!');
      navigate(`/live/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold flex items-center gap-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          <Sparkles className="w-10 h-10 text-purple-400" />
          {t('newTest')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-3 text-lg">{t('describeTest')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            {/* Target URL */}
            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                <Globe2 className="w-4 h-4 inline mr-2" />{t('targetUrl')}
              </label>
              <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required
                placeholder="https://example.com"
                className="input-glass w-full px-5 py-4 text-lg" />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
                <Zap className="w-4 h-4 inline mr-2" />{t('describeTest')}
              </label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required rows={6}
                placeholder={t('testPlaceholder')}
                className="input-glass w-full px-5 py-4 resize-none text-lg leading-relaxed" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-3 disabled:opacity-50">
              <Sparkles className="w-6 h-6" />
              {loading ? t('generating') : t('generateAndRun')}
            </button>
          </form>
        </motion.div>

        {/* Examples Sidebar */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
          <div className="glass-card p-6 h-full border border-white/5 bg-white/5">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              {language === 'ar' ? 'أمثلة للاختبارات' : 'Example Prompts'}
            </h3>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <button type="button" key={i} onClick={() => setPrompt(ex)}
                  className="w-full text-start p-4 rounded-xl bg-black/20 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all text-sm text-[var(--text-secondary)] hover:text-white leading-relaxed">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
