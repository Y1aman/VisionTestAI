import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, CheckCircle2, XCircle, Plus, Clock, Play } from 'lucide-react';

export default function DashboardPage() {
  const { t, language } = useAuthStore();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testsApi.getAll(1, 10).then(r => { setTests(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: t('totalTests'), value: tests.length, icon: FlaskConical, color: 'blue' },
    { label: t('passRate'), value: tests.length ? Math.round((tests.filter(t => t.status === 'Passed').length / tests.length) * 100) + '%' : '0%', icon: TrendingUp, color: 'purple' },
    { label: t('passed'), value: tests.filter(t => t.status === 'Passed').length, icon: CheckCircle2, color: 'emerald' },
    { label: t('failed'), value: tests.filter(t => t.status === 'Failed').length, icon: XCircle, color: 'red' },
  ];

  const statusBadge = (status: string) => {
    const key = `status${status}` as any;
    const label = t(key) || status;
    const cls = status === 'Passed' ? 'badge-passed' : status === 'Failed' ? 'badge-failed' : status === 'Running' ? 'badge-running' : status === 'Queued' ? 'badge-queued' : 'badge-pending';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pb-1">{t('dashboard')}</h1>
          <p className="text-[var(--text-secondary)] mt-2 text-lg">{language === 'ar' ? 'نظرة عامة على اختباراتك ومساحة العمل' : 'Overview of your testing workspace'}</p>
        </div>
        <button onClick={() => navigate('/new-test')}
          className="btn-primary px-8 py-4 flex items-center gap-3">
          <Plus className="w-5 h-5" />
          {t('newTest')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-7 h-7 text-${color}-400`} />
              </div>
            </div>
            <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Tests */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-6 text-white">{t('recentTests')}</h2>
        {loading ? (
          <p className="text-[var(--text-secondary)] text-center py-12 text-lg">{t('loading')}</p>
        ) : tests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FlaskConical className="w-12 h-12 text-blue-400/50" />
            </div>
            <p className="text-[var(--text-secondary)] mb-6 text-lg">{t('noData')}</p>
            <button onClick={() => navigate('/new-test')} className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              {t('newTest')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[var(--text-secondary)] text-sm border-b border-white/10">
                  <th className="text-start pb-4 font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th className="text-start pb-4 font-medium">{language === 'ar' ? 'الرابط' : 'URL'}</th>
                  <th className="text-start pb-4 font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-start pb-4 font-medium">{t('duration')}</th>
                  <th className="text-start pb-4 font-medium">{t('createdAt')}</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(test.status === 'Running' ? `/live/${test.id}` : `/report/${test.id}`)}>
                    <td className="py-5 max-w-xs truncate font-medium text-white group-hover:text-blue-400 transition-colors pr-4">{test.prompt}</td>
                    <td className="py-5 text-sm text-[var(--text-secondary)] max-w-[200px] truncate pr-4">{test.targetUrl}</td>
                    <td className="py-5 pr-4">{statusBadge(test.status)}</td>
                    <td className="py-5 text-sm text-[var(--text-secondary)] pr-4"><Clock className="w-3.5 h-3.5 inline mr-1.5" />{test.durationMs ? `${(test.durationMs/1000).toFixed(1)}s` : '-'}</td>
                    <td className="py-5 text-sm text-[var(--text-secondary)] pr-4">{new Date(test.createdAt).toLocaleDateString()}</td>
                    <td className="py-5 text-end pl-4">
                      <button className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 w-full max-w-[120px] ml-auto">
                        {test.status === 'Running' ? <><Play className="w-3 h-3" /> Live</> : t('viewReport')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
