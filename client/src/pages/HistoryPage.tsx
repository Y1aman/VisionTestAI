import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { History, Clock, ExternalLink, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3 text-[var(--text-heading)] tracking-tight">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '12px', background: 'var(--accent-glow)' }}>
            <History className="w-5 h-5 text-[var(--accent)]" />
          </div>
          {t('history')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-base">{language === 'ar' ? 'جميع سجلات الاختبارات السابقة' : 'All past test execution records'}</p>
      </div>

      <div className="overflow-hidden" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        {loading ? (
          <p className="text-center py-20 text-[var(--text-secondary)] text-sm">{t('loading')}</p>
        ) : tests.length === 0 ? (
          <p className="text-center py-20 text-[var(--text-secondary)] text-sm">{t('noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[var(--text-secondary)] text-xs uppercase tracking-wider" style={{ background: 'var(--hover-surface)' }}>
                  <th className="text-start px-6 py-4 font-medium w-12">#</th>
                  <th className="text-start px-5 py-4 font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th className="text-start px-5 py-4 font-medium">{language === 'ar' ? 'الرابط' : 'URL'}</th>
                  <th className="text-start px-5 py-4 font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-5 py-4 font-medium">{language === 'ar' ? 'الخطوات' : 'Steps'}</th>
                  <th className="text-start px-5 py-4 font-medium">{t('duration')}</th>
                  <th className="text-start px-5 py-4 font-medium">{t('createdAt')}</th>
                  <th className="px-5 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, i) => (
                  <motion.tr key={test.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-t border-[var(--border-color)] hover:bg-[var(--hover-surface)] transition-colors duration-150 cursor-pointer group"
                    onClick={() => navigate(test.status === 'Running' ? `/live/${test.id}` : `/report/${test.id}`)}>
                    <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-mono">{(page - 1) * 15 + i + 1}</td>
                    <td className="px-5 py-5 max-w-[220px]">
                      <p className="text-sm truncate text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{test.prompt}</p>
                    </td>
                    <td className="px-5 py-5 text-xs text-[var(--text-secondary)] max-w-[180px] truncate font-mono">
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />{test.targetUrl}
                      </div>
                    </td>
                    <td className="px-5 py-5">{statusBadge(test.status)}</td>
                    <td className="px-5 py-5 text-sm">
                      <span className="text-[var(--badge-pass-text)] font-medium">{test.passedSteps}</span>
                      <span className="text-[var(--text-secondary)] mx-0.5">/</span>
                      <span className="text-[var(--text-secondary)]">{test.totalSteps}</span>
                    </td>
                    <td className="px-5 py-5 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-50" />
                        {test.durationMs ? `${(test.durationMs/1000).toFixed(1)}s` : '—'}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-xs text-[var(--text-secondary)]">{new Date(test.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-5">
                      <ArrowUpRight className="w-4 h-4 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-5" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover-surface)] disabled:opacity-30 transition-all"
              style={{ borderRadius: '10px' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-9 h-9 text-xs font-medium transition-all duration-200"
                style={{
                  borderRadius: '10px',
                  ...(page === i + 1
                    ? { background: 'var(--accent)', color: 'white', boxShadow: '0 2px 8px var(--accent-glow)' }
                    : { color: 'var(--text-secondary)' }
                  ),
                }}>
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover-surface)] disabled:opacity-30 transition-all"
              style={{ borderRadius: '10px' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
