import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle2, XCircle, Loader2, Radio, Clock, ArrowRight } from 'lucide-react';

interface StepUpdate { stepIndex: number; passed: boolean; description: string; descriptionAr: string; errorMessage?: string; durationMs: number; }
interface FrameData { stepIndex: number; base64Image: string; description: string; status: string; }

export default function LiveTestPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language, token } = useAuthStore();
  const navigate = useNavigate();
  const [frame, setFrame] = useState<string>('');
  const [steps, setSteps] = useState<StepUpdate[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [finalStatus, setFinalStatus] = useState('');
  const connRef = useRef<any>(null);

  useEffect(() => {
    if (!id || !token) return;

    const apiBase = import.meta.env.VITE_API_URL || '';
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBase}/hubs/test-stream?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connRef.current = connection;

    connection.on('ReceiveFrame', (data: FrameData) => {
      setFrame(data.base64Image);
      setCurrentStep(data.stepIndex);
    });

    connection.on('StepCompleted', (data: StepUpdate) => {
      setSteps(prev => [...prev, data]);
    });

    connection.on('TestCompleted', (data: any) => {
      setCompleted(true);
      setFinalStatus(data.status);
    });

    connection.start().then(() => {
      connection.invoke('JoinTestGroup', id);
    }).catch(console.error);

    const poll = setInterval(async () => {
      try {
        const res = await testsApi.getById(id);
        if (res.data.status === 'Passed' || res.data.status === 'Failed' || res.data.status === 'Error') {
          setCompleted(true);
          setFinalStatus(res.data.status);
          clearInterval(poll);
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(poll);
      connection.stop();
    };
  }, [id, token]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[var(--text-heading)] tracking-tight">
          {completed ? (
            finalStatus === 'Passed' ? <CheckCircle2 className="w-7 h-7 text-[var(--badge-pass-text)]" /> : <XCircle className="w-7 h-7 text-[var(--badge-fail-text)]" />
          ) : (
            <Radio className="w-7 h-7 text-[var(--accent)] animate-pulse" />
          )}
          {t('liveStream')}
        </h1>
        {completed && (
          <button onClick={() => navigate(`/report/${id}`)}
            className="login-submit px-6 py-3 text-sm w-auto">
            <span>{t('viewReport')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Browser Stream — 2/3 width */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {/* Browser chrome bar */}
            <div className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(234, 179, 8, 0.5)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.5)' }} />
              </div>
              <div className="flex-1 mx-2 px-4 py-2 text-xs text-[var(--text-secondary)] truncate font-mono flex items-center gap-2" style={{ borderRadius: '8px', background: 'var(--hover-surface)' }}>
                <Monitor className="w-3 h-3 flex-shrink-0" />
                {language === 'ar' ? 'بث مباشر للمتصفح' : 'Live Browser Stream'}
              </div>
              {!completed && <div className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-live flex-shrink-0" />}
            </div>
            {/* Frame */}
            <div className="aspect-video flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
              {frame ? (
                <img src={`data:image/jpeg;base64,${frame}`} alt="Browser" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-[var(--text-secondary)]">
                  <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-[var(--accent)] opacity-40" />
                  <p className="text-sm">{t('watching')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steps Timeline — 1/3 width */}
        <div className="overflow-hidden flex flex-col max-h-[650px]" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-heading)] uppercase tracking-wider">
              {t('testSteps')}
              {steps.length > 0 && <span className="text-xs text-[var(--text-secondary)] normal-case tracking-normal font-normal">({steps.length})</span>}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {steps.length === 0 && !completed && (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin opacity-50" />
                <p className="text-xs">{language === 'ar' ? 'في انتظار الخطوات...' : 'Waiting for steps...'}</p>
              </div>
            )}
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: language === 'ar' ? -12 : 12 }} animate={{ opacity: 1, x: 0 }}
                className="p-5 transition-all"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${step.passed ? 'var(--badge-pass-border)' : 'var(--badge-fail-border)'}`,
                  background: step.passed ? 'var(--badge-pass-bg)' : 'var(--badge-fail-bg)',
                }}>
                <div className="flex items-start gap-3">
                  {step.passed
                    ? <CheckCircle2 className="w-5 h-5 text-[var(--badge-pass-text)] mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-[var(--badge-fail-text)] mt-0.5 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] leading-relaxed">{language === 'ar' ? step.descriptionAr : step.description}</p>
                    {step.errorMessage && (
                      <div className="mt-3 p-3.5" style={{ borderRadius: '10px', background: 'var(--badge-fail-bg)', border: '1px solid var(--badge-fail-border)' }}>
                        <p className="text-xs text-[var(--badge-fail-text)] font-mono leading-relaxed break-all">{step.errorMessage}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="text-[11px] text-[var(--text-secondary)] font-mono">{step.durationMs}ms</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
