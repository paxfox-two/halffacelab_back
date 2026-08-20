// @mediapipe/tasks-vision ships its WASM runtime inside node_modules; we
// serve it from public/ so FaceLandmarker loads locally instead of from a
// CDN. Copied at install time rather than committed to git (~34MB of
// binaries with every browser/backend build permutation).
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const dest = join(root, 'public/mediapipe/wasm');

if (!existsSync(src)) {
  console.warn('[copy-mediapipe-wasm] source not found, skipping:', src);
  process.exit(0);
}

cpSync(src, dest, { recursive: true });
console.log('[copy-mediapipe-wasm] copied to', dest);
