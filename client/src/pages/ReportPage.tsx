import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, Clock, Brain, AlertTriangle, Sparkles } from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    testsApi.getById(id).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center py-20 text-[var(--text-secondary)]">{t('loading')}</p>;
  if (!data) return <p className="text-center py-20 text-[var(--text-secondary)]">{t('noData')}</p>;

  const report = data.report;
  const isPassed = data.status === 'Passed';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <FileText className="w-8 h-8 text-blue-400" />
        {t('testReport')}
      </h1>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-8 border-2 ${isPassed ? 'border-green-500/30' : 'border-red-500/30'}`}>
        <div className="flex items-center gap-4 mb-6">
          {isPassed
            ? <CheckCircle2 className="w-12 h-12 text-green-400" />
            : <XCircle className="w-12 h-12 text-red-400" />
          }
          <div>
            <h2 className="text-2xl font-bold">{isPassed ? t('passed') : t('failed')}</h2>
            <p className="text-[var(--text-secondary)]">{data.prompt}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('passed'), value: report?.passedSteps || 0, color: 'green' },
            { label: t('failed'), value: report?.failedSteps || 0, color: 'red' },
            { label: t('skipped'), value: report?.skippedSteps || 0, color: 'amber' },
            { label: t('duration'), value: report ? `${(report.durationMs / 1000).toFixed(1)}s` : '-', color: 'blue' },
          ].map(({ label, value, color }, i) => (
            <div key={i} className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
              <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Analysis */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            {t('aiAnalysis')}
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm font-medium text-blue-400 mb-1">
                <Sparkles className="w-4 h-4 inline mr-1" />{t('whatHappened')}
              </p>
              <p className="text-[var(--text-primary)]">{language === 'ar' ? report.aiSummaryAr : report.aiSummary}</p>
            </div>
            {(report.aiFailureAnalysis || report.aiFailureAnalysisAr) && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-medium text-red-400 mb-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />{language === 'ar' ? 'تحليل الفشل' : 'Failure Analysis'}
                </p>
                <p className="text-[var(--text-primary)]">{language === 'ar' ? report.aiFailureAnalysisAr : report.aiFailureAnalysis}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Step Details with Screenshots */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-6">{t('stepDetails')}</h2>
        <div className="space-y-4">
          {(data.stepResults || []).map((step: any, i: number) => (
            <div key={i} className={`p-4 rounded-xl border transition-all ${
              step.status === 'Passed' ? 'bg-green-500/5 border-green-500/20' : step.status === 'Failed' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-[var(--border-color)]'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'Passed'
                    ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                    : <XCircle className="w-5 h-5 text-red-400" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{language === 'ar' ? step.descriptionAr : step.description}</p>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span className={`badge ${step.status === 'Passed' ? 'badge-passed' : 'badge-failed'}`}>{step.action}</span>
                      <Clock className="w-3 h-3" />
                      <span>{step.durationMs}ms</span>
                    </div>
                  </div>
                  {step.errorMessage && (
                    <p className="text-sm text-red-400 mt-2 p-2 rounded-lg bg-red-500/10">{step.errorMessage}</p>
                  )}
                  {step.screenshotBase64 && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-[var(--border-color)]">
                      <img src={`data:image/jpeg;base64,${step.screenshotBase64}`} alt={`Step ${i + 1}`} className="w-full max-h-64 object-contain bg-black" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
