import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Camera.module.css';
import { Tag } from '../components/Tag';
import { ChevronLeftIcon, CloseIcon, LightIcon, FaceIcon, DistanceIcon } from '../components/Icon';
import { useTrial } from '../context/TrialContext';
import { analyzeFrame, type CheekSample, type QualityCheck } from '../lib/faceAnalysis';

const CONSECUTIVE_GOOD_NEEDED = 4;

export function Camera() {
  const navigate = useNavigate();
  const { trial, loading: trialLoading } = useTrial();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const goodStreakRef = useRef(0);
  const capturedRef = useRef(false);

  const [quality, setQuality] = useState<QualityCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (trialLoading) return;
    if (!trial) {
      navigate('/');
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setReady(true);
      })
      .catch(() => {
        setError('카메라에 접근할 수 없습니다. 브라우저의 카메라 권한을 허용해 주세요.');
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial, trialLoading]);

  useEffect(() => {
    if (!ready || !trial) return;
    let raf = 0;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2 && !capturedRef.current) {
        try {
          const result = await analyzeFrame(video, canvas, { sampleCheeks: false });
          setQuality(result.quality);
          const allGood =
            result.quality.faceDetected && result.quality.lighting === 'good' && result.quality.frontal === 'good' && result.quality.distance === 'good';
          goodStreakRef.current = allGood ? goodStreakRef.current + 1 : 0;
          if (goodStreakRef.current >= CONSECUTIVE_GOOD_NEEDED) {
            void capture();
          }
        } catch {
          // model still warming up / transient frame issue — keep polling
        }
      }
      raf = window.setTimeout(tick, 280) as unknown as number;
    };
    tick();

    return () => {
      stopped = true;
      clearTimeout(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, trial]);

  const capture = async () => {
    if (capturedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    capturedRef.current = true;
    const result = await analyzeFrame(video, canvas, { sampleCheeks: true });
    if (!result.cheeks) {
      capturedRef.current = false;
      goodStreakRef.current = 0;
      return;
    }
    const previewImage = canvas.toDataURL('image/jpeg', 0.85);
    navigate('/measure/check', {
      state: {
        cheeks: result.cheeks as CheekSample[],
        quality: result.quality,
        capturedAt: new Date().toISOString(),
        previewImage,
      },
    });
  };

  if (!trial) return null;

  const controlArm = trial.arms.find((a) => a.role === 'CONTROL');
  const testArm = trial.arms.find((a) => a.role === 'TEST');
  const leftLabel = controlArm?.side === 'LEFT' ? '기존' : '신규';
  const rightLabel = controlArm?.side === 'LEFT' ? '신규' : '기존';
  void testArm;

  return (
    <div className={styles.page}>
      <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      <div className={styles.navRow}>
        <button className={styles.navBtn} onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeftIcon color="#fff" />
        </button>
        <span className={styles.navTitle}>측정</span>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <CloseIcon color="#fff" />
        </button>
      </div>

      <div className={styles.overlayTop}>
        <div className={styles.instruction}>얼굴을 가이드라인 안에 위치시켜 주세요.</div>
        <div className={styles.tagRow}>
          <Tag variant={quality?.lighting === 'good' ? 'good' : 'warning'} icon={<LightIcon size={18} />}>
            {quality?.lighting === 'good' ? '조명 양호' : '조명 부족'}
          </Tag>
          <Tag variant={quality?.frontal === 'good' ? 'good' : 'warning'} icon={<FaceIcon size={18} />}>
            {quality?.frontal === 'good' ? '정면' : '각도 확인'}
          </Tag>
          <Tag variant={quality?.distance === 'good' ? 'good' : 'warning'} icon={<DistanceIcon size={18} />}>
            {quality?.distance === 'too_far' ? '거리 부족' : quality?.distance === 'too_close' ? '거리 초과' : '거리 적정'}
          </Tag>
        </div>
        <div className={styles.hint}>조건을 충족하면 자동으로 촬영됩니다</div>
      </div>

      <div className={styles.guideRow}>
        <div className={styles.guideOval}>
          <span>{leftLabel}</span>
        </div>
        <div className={styles.guideOval}>
          <span>{rightLabel}</span>
        </div>
      </div>

      <div className={styles.shutterWrap}>
        <button className={styles.shutter} onClick={() => void capture()} disabled={!quality?.faceDetected} aria-label="촬영" />
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
