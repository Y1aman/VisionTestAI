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
    { label: t('passed'), value: report?.passedSteps || 0, colorClass: 'report-metric--pass' },
    { label: t('failed'), value: report?.failedSteps || 0, colorClass: 'report-metric--fail' },
    { label: t('skipped'), value: report?.skippedSteps || 0, colorClass: 'report-metric--skip' },
    { label: t('duration'), value: report ? `${(report.durationMs / 1000).toFixed(1)}s` : '—', colorClass: 'report-metric--duration' },
  ];

  return (
    <div className="max-w-5xl mx-auto report-page">
      {/* Back + Title */}
      <div className="report-header">
        <button onClick={() => navigate('/history')} className="report-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="report-title">
          <FileText className="w-7 h-7 text-[var(--accent)]" />
          {t('testReport')}
        </h1>
      </div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="report-card">
        {/* Status Header */}
        <div className={`report-status-header ${isPassed ? 'report-status-header--pass' : 'report-status-header--fail'}`}>
          {isPassed
            ? <CheckCircle2 className="w-12 h-12 flex-shrink-0 report-status-icon--pass" />
            : <XCircle className="w-12 h-12 flex-shrink-0 report-status-icon--fail" />
          }
          <div className="flex-1 min-w-0">
            <h2 className="report-status-title">{isPassed ? t('passed') : t('failed')}</h2>
            <p className="report-status-prompt">{data.prompt}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="report-metrics-grid">
          {metricCards.map(({ label, value, colorClass }, i) => (
            <div key={i} className={`report-metric-card ${colorClass}`}>
              <p className="report-metric-value">{value}</p>
              <p className="report-metric-label">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Analysis */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="report-card">
          <div className="report-section-header">
            <h2 className="report-section-heading">
              <Brain className="w-5 h-5 text-[var(--accent)]" />
              {t('aiAnalysis')}
            </h2>
          </div>
          <div className="report-analysis-body">
            <div className="report-analysis-panel">
              <p className="report-analysis-badge">
                <Sparkles className="w-3.5 h-3.5" />{t('whatHappened')}
              </p>
              <p className="report-analysis-text">{language === 'ar' ? report.aiSummaryAr : report.aiSummary}</p>
            </div>

            {(report.aiFailureAnalysis || report.aiFailureAnalysisAr) && (
              <div className="report-failure-panel">
                <p className="report-failure-badge">
                  <AlertTriangle className="w-3.5 h-3.5" />{language === 'ar' ? 'تحليل الفشل' : 'Failure Analysis'}
                </p>
                <p className="report-analysis-text">{language === 'ar' ? report.aiFailureAnalysisAr : report.aiFailureAnalysis}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Step Details — Accordion */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="report-card">
        <div className="report-section-header">
          <h2 className="report-section-heading">{t('stepDetails')}</h2>
        </div>
        <div className="report-steps-list">
          {(data.stepResults || []).map((step: any, i: number) => {
            const isExpanded = expandedSteps.has(i);
            const hasDetails = step.errorMessage || step.screenshotBase64;

            return (
              <div key={i} className="report-step-row">
                <button
                  onClick={() => hasDetails && toggleStep(i)}
                  className={`report-step-btn ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex-shrink-0">
                    {step.status === 'Passed'
                      ? <CheckCircle2 className="w-5 h-5 text-[var(--badge-pass-text)]" />
                      : <XCircle className="w-5 h-5 text-[var(--badge-fail-text)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="report-step-desc">{language === 'ar' ? step.descriptionAr : step.description}</p>
                  </div>
                  <div className="report-step-meta">
                    <span className="report-action-badge">{step.action}</span>
                    <span className="report-step-duration">
                      <Clock className="w-3 h-3" />{step.durationMs}ms
                    </span>
                    {hasDetails && (
                      <span className="report-step-chevron">
                        {isExpanded
                          ? <ChevronDown className="w-4.5 h-4.5" />
                          : <ChevronRight className="w-4.5 h-4.5" />
                        }
                      </span>
                    )}
                  </div>
                </button>

                {isExpanded && hasDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="report-step-details"
                  >
                    {step.errorMessage && (
                      <div className="report-error-box">
                        <p className="report-error-text">{step.errorMessage}</p>
                      </div>
                    )}
                    {step.screenshotBase64 && (
                      <div className="report-screenshot-frame">
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
