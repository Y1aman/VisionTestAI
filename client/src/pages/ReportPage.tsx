import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, Clock, Brain, AlertTriangle, Sparkles, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    testsApi.getById(id).then(r => {
      setData(r.data);
      setLoading(false);
      const failed = new Set<number>();
      (r.data.stepResults || []).forEach((s: any, i: number) => {
        if (s.status === 'Failed') failed.add(i);
      });
      setExpandedSteps(failed);
    }).catch(() => setLoading(false));
  }, [id]);

  const toggleStep = (i: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (loading) return <p className="text-center py-24 text-[var(--text-secondary)] text-sm">{t('loading')}</p>;
  if (!data) return <p className="text-center py-24 text-[var(--text-secondary)] text-sm">{t('noData')}</p>;

  const report = data.report;
  const isPassed = data.status === 'Passed';

  const metricCards = [
    { label: t('passed'), value: report?.passedSteps || 0, valueColor: '#6ee7b7', borderCol: 'rgba(16, 185, 129, 0.18)' },
    { label: t('failed'), value: report?.failedSteps || 0, valueColor: '#fca5a5', borderCol: 'rgba(239, 68, 68, 0.18)' },
    { label: t('skipped'), value: report?.skippedSteps || 0, valueColor: '#a1a1aa', borderCol: 'rgba(161, 161, 170, 0.18)' },
    { label: t('duration'), value: report ? `${(report.durationMs / 1000).toFixed(1)}s` : '—', valueColor: '#93c5fd', borderCol: 'rgba(99, 102, 241, 0.18)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/history')} className="p-2.5 hover:bg-[var(--hover-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" style={{ borderRadius: '10px' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[var(--text-heading)] tracking-tight">
          <FileText className="w-7 h-7 text-[var(--accent)]" />
          {t('testReport')}
        </h1>
      </div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden"
        style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        {/* Status Header */}
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          style={{ borderBottom: '1px solid var(--border-color)', background: isPassed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
          {isPassed
            ? <CheckCircle2 className="w-12 h-12 flex-shrink-0" style={{ color: '#6ee7b7' }} />
            : <XCircle className="w-12 h-12 flex-shrink-0" style={{ color: '#fca5a5' }} />
          }
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-[var(--text-heading)]">{isPassed ? t('passed') : t('failed')}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{data.prompt}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          {metricCards.map(({ label, value, valueColor, borderCol }, i) => (
            <div key={i} className="p-6 text-center"
              style={{ borderRadius: '14px', border: `1px solid ${borderCol}`, background: 'var(--bg-primary)' }}>
              <p className="text-3xl font-bold" style={{ color: valueColor }}>{value}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2 uppercase tracking-wider font-medium">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Analysis */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="overflow-hidden"
          style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2.5 text-[var(--text-heading)] uppercase tracking-wider">
              <Brain className="w-5 h-5 text-[var(--accent)]" />
              {t('aiAnalysis')}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="p-6" style={{ borderRadius: '14px', background: 'var(--hover-surface)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs font-semibold text-[var(--accent)] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />{t('whatHappened')}
              </p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{language === 'ar' ? report.aiSummaryAr : report.aiSummary}</p>
            </div>

            {(report.aiFailureAnalysis || report.aiFailureAnalysisAr) && (
              <div className="p-6" style={{ borderRadius: '14px', background: 'var(--badge-fail-bg)', border: '1px solid var(--badge-fail-border)' }}>
                <p className="text-xs font-semibold text-[var(--badge-fail-text)] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />{language === 'ar' ? 'تحليل الفشل' : 'Failure Analysis'}
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{language === 'ar' ? report.aiFailureAnalysisAr : report.aiFailureAnalysis}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Step Details — Accordion */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="overflow-hidden"
        style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-sm font-semibold text-[var(--text-heading)] uppercase tracking-wider">{t('stepDetails')}</h2>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {(data.stepResults || []).map((step: any, i: number) => {
            const isExpanded = expandedSteps.has(i);
            const hasDetails = step.errorMessage || step.screenshotBase64;

            return (
              <div key={i} className="transition-colors hover:bg-[var(--hover-surface)]">
                <button
                  onClick={() => hasDetails && toggleStep(i)}
                  className={`w-full flex items-center gap-4 px-8 py-5 text-start ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex-shrink-0">
                    {step.status === 'Passed'
                      ? <CheckCircle2 className="w-5 h-5 text-[var(--badge-pass-text)]" />
                      : <XCircle className="w-5 h-5 text-[var(--badge-fail-text)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{language === 'ar' ? step.descriptionAr : step.description}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`badge text-[11px] ${step.status === 'Passed' ? 'badge-passed' : 'badge-failed'}`}>{step.action}</span>
                    <span className="text-xs text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />{step.durationMs}ms
                    </span>
                    {hasDetails && (
                      isExpanded
                        ? <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                        : <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </div>
                </button>

                {isExpanded && hasDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-8 pb-6"
                    style={{ paddingLeft: '60px' }}
                  >
                    {step.errorMessage && (
                      <div className="p-5 mb-4" style={{ borderRadius: '12px', background: 'var(--badge-fail-bg)', border: '1px solid var(--badge-fail-border)' }}>
                        <p className="text-xs text-[var(--badge-fail-text)] font-mono leading-relaxed break-all">{step.errorMessage}</p>
                      </div>
                    )}
                    {step.screenshotBase64 && (
                      <div className="overflow-hidden" style={{ borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                        <img src={`data:image/jpeg;base64,${step.screenshotBase64}`} alt={`Step ${i + 1}`} className="w-full max-h-80 object-contain" />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
