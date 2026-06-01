import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { History, Clock, ExternalLink } from 'lucide-react';

export default function HistoryPage() {
  const { t, language } = useAuthStore();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    testsApi.getAll(page, 15).then(r => {
      setTests(r.data.items || []);
      setTotalPages(r.data.totalPages || 1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  const statusBadge = (status: string) => {
    const key = `status${status}` as any;
    const label = t(key) || status;
    const cls = status === 'Passed' ? 'badge-passed' : status === 'Failed' ? 'badge-failed' : status === 'Running' ? 'badge-running' : status === 'Queued' ? 'badge-queued' : 'badge-pending';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
        <History className="w-8 h-8 text-blue-400" />
        {t('history')}
      </h1>

      <div className="glass-card overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="text-center py-12 text-[var(--text-secondary)]">{t('loading')}</p>
        ) : tests.length === 0 ? (
          <p className="text-center py-12 text-[var(--text-secondary)]">{t('noData')}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[var(--text-secondary)] text-sm bg-white/5">
                <th className="text-start p-4 font-medium">#</th>
                <th className="text-start p-4 font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="text-start p-4 font-medium">{language === 'ar' ? 'الرابط' : 'URL'}</th>
                <th className="text-start p-4 font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-4 font-medium">{language === 'ar' ? 'الخطوات' : 'Steps'}</th>
                <th className="text-start p-4 font-medium">{t('duration')}</th>
                <th className="text-start p-4 font-medium">{t('createdAt')}</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, i) => (
                <motion.tr key={test.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-t border-[var(--border-color)]/30 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => navigate(test.status === 'Running' ? `/live/${test.id}` : `/report/${test.id}`)}>
                  <td className="p-4 text-sm text-[var(--text-secondary)]">{(page - 1) * 15 + i + 1}</td>
                  <td className="p-4 max-w-xs truncate text-sm">{test.prompt}</td>
                  <td className="p-4 text-xs text-[var(--text-secondary)] max-w-[200px] truncate">
                    <ExternalLink className="w-3 h-3 inline mr-1" />{test.targetUrl}
                  </td>
                  <td className="p-4">{statusBadge(test.status)}</td>
                  <td className="p-4 text-sm">
                    <span className="text-green-400">{test.passedSteps}</span>/<span className="text-[var(--text-secondary)]">{test.totalSteps}</span>
                  </td>
                  <td className="p-4 text-sm"><Clock className="w-3 h-3 inline mr-1" />{test.durationMs ? `${(test.durationMs/1000).toFixed(1)}s` : '-'}</td>
                  <td className="p-4 text-xs text-[var(--text-secondary)]">{new Date(test.createdAt).toLocaleString()}</td>
                  <td className="p-4">
                    <span className="text-blue-400 text-sm">{t('viewDetails')} →</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-[var(--border-color)]/30">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
