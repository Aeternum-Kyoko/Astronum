// Self-hosts the MediaPipe hand model for the palm reader: copies the WASM runtime
// from the installed @mediapipe/tasks-vision (so it always matches the JS) and
// downloads the hand-landmark model once. Runs before `dev` and `build`; if the
// model can't be downloaded the app falls back to Google's CDN at runtime.
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public", "mediapipe");
const wasmSrc = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

await mkdir(path.join(out, "wasm"), { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  await copyFile(path.join(wasmSrc, f), path.join(out, "wasm", f));
}

const model = path.join(out, "hand_landmarker.task");
const have = await stat(model).then((s) => s.size > 1_000_000, () => false);
if (!have) {
  try {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(model, Buffer.from(await res.arrayBuffer()));
    console.log("mediapipe: downloaded hand model");
  } catch (err) {
    console.warn(`mediapipe: couldn't download the hand model (${err.message}); the palm reader will load it from Google's CDN instead.`);
  }
}
console.log("mediapipe: runtime ready in public/mediapipe");
