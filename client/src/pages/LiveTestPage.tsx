import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { testsApi } from '../api/client';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle2, XCircle, Loader2, Radio, Clock } from 'lucide-react';

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

    // Also poll the test status in case we missed events
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
          {completed ? (
            finalStatus === 'Passed' ? <CheckCircle2 className="w-7 h-7 text-green-400" /> : <XCircle className="w-7 h-7 text-red-400" />
          ) : (
            <Radio className="w-7 h-7 text-blue-400 animate-pulse" />
          )}
          {t('liveStream')}
        </h1>
        {completed && (
          <button onClick={() => navigate(`/report/${id}`)}
            className="px-6 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all font-medium">
            {t('viewReport')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Browser Stream - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="browser-frame relative">
            {/* Browser chrome bar */}
            <div className="bg-[#1a1a3e] px-4 py-2 flex items-center gap-2 border-b border-[var(--border-color)]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-lg bg-black/30 text-xs text-[var(--text-secondary)] truncate">
                <Monitor className="w-3 h-3 inline mr-2" />
                {language === 'ar' ? 'بث مباشر للمتصفح' : 'Live Browser Stream'}
              </div>
              {!completed && <div className="w-2 h-2 rounded-full bg-red-500 pulse-live" />}
            </div>
            {/* Frame */}
            <div className="bg-black aspect-video flex items-center justify-center">
              {frame ? (
                <img src={`data:image/jpeg;base64,${frame}`} alt="Browser" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-[var(--text-secondary)]">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400/50" />
                  <p>{t('watching')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steps Timeline - 1/3 width */}
        <div className="glass-card p-6 max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {t('testSteps')}
            {steps.length > 0 && <span className="text-sm text-[var(--text-secondary)]">({steps.length})</span>}
          </h2>
          <div className="space-y-3">
            {steps.length === 0 && !completed && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">{language === 'ar' ? 'في انتظار الخطوات...' : 'Waiting for steps...'}</p>
              </div>
            )}
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-xl border transition-all ${
                  step.passed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                <div className="flex items-start gap-2">
                  {step.passed
                    ? <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{language === 'ar' ? step.descriptionAr : step.description}</p>
                    {step.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 truncate">{step.errorMessage}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span className="text-xs text-[var(--text-secondary)]">{step.durationMs}ms</span>
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
