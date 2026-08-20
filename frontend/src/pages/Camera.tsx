import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Camera.module.css';
import { Tag } from '../components/Tag';
import { ChevronLeftIcon, CloseIcon, LightIcon, FaceIcon, DistanceIcon } from '../components/Icon';
import { useTrial } from '../context/TrialContext';
import { analyzeFrame, type CheekSample, type QualityCheck, type Rect } from '../lib/faceAnalysis';

const CONSECUTIVE_GOOD_NEEDED = 4;

type ScreenTransform = { scale: number; offsetX: number; offsetY: number; width: number; height: number };

// The <video> is rendered with object-fit: cover, so a point in the
// video's native pixel space needs this same scale+crop mapping applied
// to land in the right place on screen — used to draw the live cheek
// sampling regions in sync with what analyzeFrame actually measures.
function videoToScreenTransform(video: HTMLVideoElement): ScreenTransform | null {
  const cw = video.clientWidth;
  const ch = video.clientHeight;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!cw || !ch || !vw || !vh) return null;
  const scale = Math.max(cw / vw, ch / vh);
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;
  return { scale, offsetX, offsetY, width: cw, height: ch };
}

function mapRect(rect: Rect, t: ScreenTransform) {
  return {
    x: rect.x * t.scale + t.offsetX,
    y: rect.y * t.scale + t.offsetY,
    w: rect.w * t.scale,
    h: rect.h * t.scale,
  };
}

export function Camera() {
  const navigate = useNavigate();
  const { trial, loading: trialLoading } = useTrial();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const goodStreakRef = useRef(0);
  const capturedRef = useRef(false);

  const [quality, setQuality] = useState<QualityCheck | null>(null);
  const [regions, setRegions] = useState<{ left: Rect; right: Rect } | null>(null);
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
          setRegions(result.regions);
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
  const leftLabel = controlArm?.side === 'LEFT' ? '기존' : '신규';
  const rightLabel = controlArm?.side === 'LEFT' ? '신규' : '기존';

  const transform = videoRef.current ? videoToScreenTransform(videoRef.current) : null;
  const screenLeft = regions && transform ? mapRect(regions.left, transform) : null;
  const screenRight = regions && transform ? mapRect(regions.right, transform) : null;

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

      <div className={styles.guideCircle} />

      {screenLeft && screenRight && transform && (
        <svg className={styles.regionSvg} viewBox={`0 0 ${transform.width} ${transform.height}`}>
          <line
            x1={screenLeft.x + screenLeft.w}
            y1={Math.min(screenLeft.y, screenRight.y) - 20}
            x2={screenLeft.x + screenLeft.w}
            y2={Math.max(screenLeft.y + screenLeft.h, screenRight.y + screenRight.h) + 20}
            stroke="rgba(255,255,255,0.8)"
            strokeDasharray="5 5"
          />
          <ellipse
            cx={screenLeft.x + screenLeft.w / 2}
            cy={screenLeft.y + screenLeft.h / 2}
            rx={screenLeft.w / 2}
            ry={screenLeft.h / 2 + 18}
            fill="rgba(52,199,89,0.35)"
          />
          <text x={screenLeft.x + screenLeft.w / 2} y={screenLeft.y + screenLeft.h + 26} className={styles.regionLabel}>
            {leftLabel}
          </text>
          <ellipse
            cx={screenRight.x + screenRight.w / 2}
            cy={screenRight.y + screenRight.h / 2}
            rx={screenRight.w / 2}
            ry={screenRight.h / 2 + 18}
            fill="rgba(15,98,254,0.3)"
          />
          <text x={screenRight.x + screenRight.w / 2} y={screenRight.y + screenRight.h + 26} className={styles.regionLabel}>
            {rightLabel}
          </text>
        </svg>
      )}

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
