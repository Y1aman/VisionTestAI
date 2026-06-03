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
    const cls = status === 'Passed' ? 'history-badge--pass'
              : status === 'Failed' ? 'history-badge--fail'
              : status === 'Running' ? 'history-badge--run'
              : status === 'Queued' ? 'history-badge--pending'
              : 'history-badge--pending';
    return <span className={`history-badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <h1 className="history-title">
          <div className="history-title-icon">
            <History className="w-5 h-5 text-[var(--accent)]" />
          </div>
          {t('history')}
        </h1>
        <p className="history-subtitle">{language === 'ar' ? 'جميع سجلات الاختبارات السابقة' : 'All past test execution records'}</p>
      </div>

      {/* Table Card */}
      <div className="history-card">
        {loading ? (
          <p className="history-empty">{t('loading')}</p>
        ) : tests.length === 0 ? (
          <p className="history-empty">{t('noData')}</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr className="history-thead-row">
                  <th className="history-th history-th--num">#</th>
                  <th className="history-th">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th className="history-th">{language === 'ar' ? 'الرابط' : 'URL'}</th>
                  <th className="history-th">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="history-th">{language === 'ar' ? 'الخطوات' : 'Steps'}</th>
                  <th className="history-th">{t('duration')}</th>
                  <th className="history-th">{t('createdAt')}</th>
                  <th className="history-th history-th--action"></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, i) => (
                  <motion.tr key={test.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="history-row"
                    onClick={() => navigate(test.status === 'Running' ? `/live/${test.id}` : `/report/${test.id}`)}>
                    <td className="history-td history-td--num">{(page - 1) * 15 + i + 1}</td>
                    <td className="history-td history-td--desc">
                      <p className="history-desc-text">{test.prompt}</p>
                    </td>
                    <td className="history-td history-td--url">
                      <div className="history-url-wrap">
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />{test.targetUrl}
                      </div>
                    </td>
                    <td className="history-td">{statusBadge(test.status)}</td>
                    <td className="history-td history-td--steps">
                      <span className="history-steps-pass">{test.passedSteps}</span>
                      <span className="history-steps-sep">/</span>
                      <span className="history-steps-total">{test.totalSteps}</span>
                    </td>
                    <td className="history-td history-td--duration">
                      <Clock className="w-3 h-3 opacity-50" />
                      {test.durationMs ? `${(test.durationMs/1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="history-td history-td--date">{new Date(test.createdAt).toLocaleString()}</td>
                    <td className="history-td history-td--arrow">
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
          <div className="history-pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="history-page-arrow"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`history-page-num ${page === i + 1 ? 'history-page-num--active' : ''}`}>
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="history-page-arrow"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
