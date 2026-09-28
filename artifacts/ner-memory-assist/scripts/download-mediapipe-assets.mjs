import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const root = resolve(process.cwd());
const publicDir = join(root, 'public', 'mediapipe');
const wasmOut = join(publicDir, 'wasm');
const modelOut = join(publicDir, 'pose_landmarker_full.task');

const require = createRequire(import.meta.url);
const visionEntry = require.resolve('@mediapipe/tasks-vision');
const visionRoot = dirname(visionEntry);
const wasmSource = join(visionRoot, 'wasm');

await mkdir(wasmOut, { recursive: true });
await cp(wasmSource, wasmOut, { recursive: true, force: true });

if (!await fileExists(modelOut)) {
  const modelUrl = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';
  const response = await fetch(modelUrl);
  if (!response.ok) throw new Error(`Failed to download MediaPipe pose model: ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(modelOut, buffer);
}

console.log('MediaPipe assets prepared locally.');

async function fileExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
