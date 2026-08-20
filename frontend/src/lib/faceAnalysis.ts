import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { rgbToLab } from './color';
import type { Side } from './types';

// Landmark indices from MediaPipe's canonical 478-point face mesh.
const MIDLINE = [1, 4, 168, 152, 10]; // nose tip/base/bridge, chin, forehead
const EYE_OUTER = [33, 263];
const MOUTH_CORNERS = [61, 291];

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

export type QualityCheck = {
  lighting: 'good' | 'poor';
  frontal: 'good' | 'poor';
  distance: 'good' | 'too_far' | 'too_close';
  faceDetected: boolean;
  brightness: number; // 0-255 average luma
};

export type CheekSample = {
  side: Side;
  meanR: number;
  meanG: number;
  meanB: number;
  labL: number;
  labA: number;
  labB: number;
  samplePixels: number;
  rect: { x: number; y: number; w: number; h: number };
};

export type FrameAnalysis = {
  quality: QualityCheck;
  cheeks: CheekSample[] | null;
  midlineX: number | null;
};

type Point = { x: number; y: number };

function avg(points: Point[]): Point {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

function sampleRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): { r: number; g: number; b: number; count: number } {
  const rx = Math.max(0, Math.round(x));
  const ry = Math.max(0, Math.round(y));
  const rw = Math.max(1, Math.round(w));
  const rh = Math.max(1, Math.round(h));
  const data = ctx.getImageData(rx, ry, rw, rh).data;
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / count, g: g / count, b: b / count, count };
}

// Runs face landmark detection on the current video frame, evaluates
// capture-quality heuristics (lighting/frontal/distance), and — when the
// caller asks for it — samples the actual left/right cheek pixels and
// converts them to Lab so the redness value is computed from the real
// photo, never a fixed or random number.
export async function analyzeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  { sampleCheeks }: { sampleCheeks: boolean },
): Promise<FrameAnalysis> {
  const landmarker = await loadFaceLandmarker();
  const w = video.videoWidth;
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(video, 0, 0, w, h);

  const result = landmarker.detectForVideo(video, performance.now());
  const landmarks = result.faceLandmarks?.[0];

  // Whole-frame brightness (average luma) drives the lighting check
  // regardless of whether a face was found yet.
  const full = ctx.getImageData(0, 0, w, h).data;
  let lumaSum = 0;
  const stride = 4 * 37; // sample every ~37th pixel, plenty for a stable average
  let sampled = 0;
  for (let i = 0; i < full.length; i += stride) {
    lumaSum += 0.299 * full[i] + 0.587 * full[i + 1] + 0.114 * full[i + 2];
    sampled++;
  }
  const brightness = sampled > 0 ? lumaSum / sampled : 0;
  const lighting: QualityCheck['lighting'] = brightness >= 70 && brightness <= 230 ? 'good' : 'poor';

  if (!landmarks) {
    return {
      quality: { lighting, frontal: 'poor', distance: 'too_far', faceDetected: false, brightness },
      cheeks: null,
      midlineX: null,
    };
  }

  const px = (i: number): Point => ({ x: landmarks[i].x * w, y: landmarks[i].y * h });

  const midline = avg(MIDLINE.map(px));
  const eyes = EYE_OUTER.map(px);
  const mouth = MOUTH_CORNERS.map(px);
  const eyeY = avg(eyes).y;
  const mouthY = avg(mouth).y;

  const xs = landmarks.map((l) => l.x * w);
  const ys = landmarks.map((l) => l.y * h);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;

  // Frontal check: outer eye corners should sit roughly level, and the
  // midline should sit roughly centered between the face's left/right
  // extremes — both degrade under yaw/roll.
  const eyeLevelDiff = Math.abs(eyes[0].y - eyes[1].y) / faceHeight;
  const midlineOffset = Math.abs(midline.x - (minX + maxX) / 2) / faceWidth;
  const frontal: QualityCheck['frontal'] = eyeLevelDiff < 0.04 && midlineOffset < 0.08 ? 'good' : 'poor';

  // Distance check: face width relative to frame width.
  const widthRatio = faceWidth / w;
  let distance: QualityCheck['distance'] = 'good';
  if (widthRatio < 0.28) distance = 'too_far';
  else if (widthRatio > 0.62) distance = 'too_close';

  const quality: QualityCheck = { lighting, frontal, distance, faceDetected: true, brightness };

  if (!sampleCheeks) {
    return { quality, cheeks: null, midlineX: midline.x };
  }

  const bandTop = eyeY + (mouthY - eyeY) * 0.18;
  const bandBottom = mouthY - (mouthY - eyeY) * 0.08;
  const bandHeight = Math.max(4, bandBottom - bandTop);
  const inset = faceWidth * 0.15;
  const gap = faceWidth * 0.06;

  const leftRect = { x: minX + inset, y: bandTop, w: Math.max(4, midline.x - gap - (minX + inset)), h: bandHeight };
  const rightRect = {
    x: midline.x + gap,
    y: bandTop,
    w: Math.max(4, maxX - inset - (midline.x + gap)),
    h: bandHeight,
  };

  const cheeks: CheekSample[] = [leftRect, rightRect].map((rect, i) => {
    const { r, g, b, count } = sampleRect(ctx, rect.x, rect.y, rect.w, rect.h);
    const lab = rgbToLab(r, g, b);
    return {
      side: (i === 0 ? 'LEFT' : 'RIGHT') as Side,
      meanR: r,
      meanG: g,
      meanB: b,
      labL: lab.L,
      labA: lab.a,
      labB: lab.b,
      samplePixels: count,
      rect,
    };
  });

  return { quality, cheeks, midlineX: midline.x };
}
