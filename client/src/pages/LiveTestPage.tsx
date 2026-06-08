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

    // Build the hub URL — automatically detect wss:// vs ws://
    // Handles: 1) Explicit VITE_API_URL (e.g. Render split-service)
    //          2) Same-origin (reverse-proxy or local dev proxy)
    const configuredBase = import.meta.env.VITE_API_URL || '';
    let hubUrl: string;

    if (configuredBase) {
      // Explicit API URL set (e.g. "https://myapi.onrender.com/api")
      // Strip trailing /api if present since the hub is at /hubs/test-stream
      let base = configuredBase.replace(/\/api\/?$/, '');
      // Force wss:// if the API base is HTTPS
      if (base.startsWith('https://')) {
        base = base.replace(/^https:\/\//, 'wss://');
      } else if (base.startsWith('http://')) {
        base = base.replace(/^http:\/\//, 'ws://');
      }
      hubUrl = `${base}/hubs/test-stream`;
    } else {
      // No VITE_API_URL — same origin (production behind reverse proxy or local dev)
      hubUrl = window.location.hostname === 'localhost'
        ? '/hubs/test-stream'
        : 'https://visiontestai-backend.onrender.com/hubs/test-stream';
    }

    console.log('[LiveTest] Connecting to hub:', hubUrl);

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token! })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
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
      } catch { }
    }, 3000);

    return () => {
      clearInterval(poll);
      connection.stop();
    };
  }, [id, token]);

  return (
    <div className="live-page">
      {/* Header */}
      <div className="live-header">
        <h1 className="live-title">
          {completed ? (
            finalStatus === 'Passed' ? <CheckCircle2 className="w-7 h-7 text-[var(--badge-pass-text)]" /> : <XCircle className="w-7 h-7 text-[var(--badge-fail-text)]" />
          ) : (
            <Radio className="w-7 h-7 text-[var(--accent)] animate-pulse" />
          )}
          {t('liveStream')}
        </h1>
        {completed && (
          <button onClick={() => navigate(`/report/${id}`)}
            className="live-report-btn">
            <span>{t('viewReport')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="live-grid">
        {/* Browser Stream — 2/3 width */}
        <div className="live-stream-col">
          <div className="live-browser-frame">
            {/* Browser chrome bar */}
            <div className="live-browser-chrome">
              <div className="live-browser-dots">
                <div className="live-dot live-dot--red" />
                <div className="live-dot live-dot--yellow" />
                <div className="live-dot live-dot--green" />
              </div>
              <div className="live-browser-url">
                <Monitor className="w-3 h-3 flex-shrink-0" />
                {language === 'ar' ? 'بث مباشر للمتصفح' : 'Live Browser Stream'}
              </div>
              {!completed && <div className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-live flex-shrink-0" />}
            </div>
            {/* Frame */}
            <div className="live-viewport">
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
        <div className="live-steps-col">
          <div className="live-steps-card">
            <div className="live-steps-header">
              <h2 className="live-steps-title">
                {t('testSteps')}
                {steps.length > 0 && <span className="live-steps-count">({steps.length})</span>}
              </h2>
            </div>

            <div className="live-steps-scroll">
              {steps.length === 0 && !completed && (
                <div className="live-steps-empty">
                  <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin opacity-50" />
                  <p className="text-xs">{language === 'ar' ? 'في انتظار الخطوات...' : 'Waiting for steps...'}</p>
                </div>
              )}
              {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: language === 'ar' ? -12 : 12 }} animate={{ opacity: 1, x: 0 }}
                  className={`live-step-item ${step.passed ? 'live-step-item--pass' : 'live-step-item--fail'}`}>
                  <div className="live-step-icon">
                    {step.passed
                      ? <CheckCircle2 className="w-[18px] h-[18px] text-[var(--badge-pass-text)]" />
                      : <XCircle className="w-[18px] h-[18px] text-[var(--badge-fail-text)]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="live-step-desc">{language === 'ar' ? step.descriptionAr : step.description}</p>
                    {step.errorMessage && (
                      <div className="live-step-error">
                        <p className="live-step-error-text">{step.errorMessage}</p>
                      </div>
                    )}
                    <div className="live-step-duration">
                      <Clock className="w-3 h-3" />
                      <span>{step.durationMs}ms</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
