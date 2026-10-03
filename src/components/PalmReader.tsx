"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import SegmentedControl from "@/components/SegmentedControl";
import { haptic } from "@/lib/haptics";
import { dist, palmFrame, palmHand, toImage, toPixels, INDEX, LITTLE, type Hand, type Landmark, type Point } from "@/lib/palmistry/frame";
import { analyzePalm, mountsFor, scanPalm, type PalmAnalysis, type PalmIssue } from "@/lib/palmistry/analyze";
import { traceAll, type LineKey, type TracedLine } from "@/lib/palmistry/lines";
import { fuseFields, type CreaseField } from "@/lib/palmistry/ridges";
import { dominantMounts, type Fullness, type KundliGrades, type MountAnswers, type MountKey, type MountReading } from "@/lib/palmistry/mounts";
import { listCharts, type StoredChart } from "@/lib/offlineCharts";
import type { Locale } from "@/lib/i18n/locale";
import { PALM_COPY, type PalmCopy } from "@/components/palmCopy";
import { planetDiagnosis } from "@/lib/astrology/planetDiagnosis";

// Served from this site (copied in by scripts/copy-mediapipe.mjs at build), with the public CDNs as a fallback.
const LOCAL = { wasm: "/mediapipe/wasm", model: "/mediapipe/hand_landmarker.task" };
const REMOTE = {
  // Keep in step with the installed @mediapipe/tasks-vision version.
  wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
  model: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
};

/** Fixed colours: the lines sit on a photo, so they don't follow the site theme. */
export const LINE_COLORS: Record<LineKey, string> = {
  heart: "#ff6b81",
  head: "#5cc8ff",
  life: "#ffc53d",
  fate: "#b892ff",
};


/** Live frames to fuse before the lines are trusted, and how long everything must stay good before auto-capture. */
const MIN_FRAMES = 6;
const HOLD_MS = 1200;

let landmarkerPromise: Promise<HandLandmarker> | null = null;

/** Loads the on-device hand model once per visit; the photo never leaves the phone. */
function loadLandmarker(): Promise<HandLandmarker> {
  landmarkerPromise ??= (async () => {
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const create = async (src: typeof LOCAL) =>
      HandLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(src.wasm), {
        // CPU, not GPU: the GPU delegate can silently find no hands on some WebGL setups, and this model is light enough for live use on CPU.
        baseOptions: { modelAssetPath: src.model, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
    try {
      return await create(LOCAL);
    } catch {
      return await create(REMOTE);
    }
  })().catch((err) => {
    landmarkerPromise = null;
    throw err;
  });
  return landmarkerPromise;
}

const other = (h: Hand): Hand => (h === "Right" ? "Left" : "Right");

interface Shot {
  url: string;
  width: number;
  height: number;
  pixels: ImageData;
  landmarks: Landmark[];
  world: Landmark[] | null;
  /** Which hand the picture shows as stored (before undoing any mirroring), assuming it shows the palm. */
  seen: Hand;
  /** The picture was flipped like a mirror (front camera), which swaps how left and right hands look. */
  mirrored: boolean;
  /** Creases fused over the live frames before capture, blended into the still's own. */
  prior: CreaseField | null;
  /** Search detail: 2 when the photo has a large, high-resolution palm. */
  scale: number;
}

type Phase = "idle" | "loading" | "live" | "analyzing" | "result";

export default function PalmReader({ locale = "en" }: { locale?: Locale }) {
  const t = PALM_COPY[locale] as PalmCopy;
  const tRef = useRef(t);
  const [phase, setPhase] = useState<Phase>("idle");
  // Set only if the reader corrects the detected hand.
  const [handFix, setHandFix] = useState<Hand | null>(null);
  // Chosen when the camera first opens: phones read the palm best with the back camera.
  const [facing, setFacing] = useState<"user" | "environment" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [dims, setDims] = useState({ w: 4, h: 3 });
  const [auto, setAuto] = useState(true);
  const [ready, setReady] = useState(0);
  const [answers, setAnswers] = useState<MountAnswers>({});
  const [charts, setCharts] = useState<StoredChart[]>([]);
  const [chartKey, setChartKey] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastScan = useRef<{ at: number; traced: TracedLine[]; issues: PalmIssue[] }>({ at: 0, traced: [], issues: [] });
  const grab = useRef<HTMLCanvasElement | null>(null);
  const fused = useRef<{ field: CreaseField | null; frames: number; lastLm: Point[] | null; readySince: number }>({ field: null, frames: 0, lastLm: null, readySince: 0 });
  const autoRef = useRef(auto);
  const captureRef = useRef<() => void>(() => {});

  useEffect(() => {
    autoRef.current = auto;
    tRef.current = t;
  }, [auto, t]);

  // Kundlis opened on this device, for the mount-to-planet cross-check.
  useEffect(() => {
    let live = true;
    listCharts().then((list) => {
      if (!live) return;
      setCharts(list);
      if (list[0]) setChartKey(list[0].key);
    });
    return () => {
      live = false;
    };
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const say = useCallback((text: string) => setStatus((prev) => (prev === text ? prev : text)), []);

  /** Runs every video frame: tracks the hand, and every quarter second re-reads the lines. */
  const loop = useCallback(
    (landmarker: HandLandmarker) => {
      let lastTime = -1;
      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        const video = videoRef.current;
        const canvas = overlayRef.current;
        if (!video || !canvas || video.readyState < 2 || video.currentTime === lastTime) return;
        lastTime = video.currentTime;
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, w, h);

        const result = landmarker.detectForVideo(video, performance.now());
        const lm = result.landmarks[0];
        const F = fused.current;
        if (!lm) {
          lastScan.current.traced = [];
          fused.current = { field: null, frames: 0, lastLm: null, readySince: 0 };
          setReady(0);
          return say(tRef.current.showHand);
        }

        const now = performance.now();
        if (now - lastScan.current.at > 200) {
          const g = (grab.current ??= document.createElement("canvas"));
          const scale = Math.min(1, 960 / w);
          g.width = Math.round(w * scale);
          g.height = Math.round(h * scale);
          const gctx = g.getContext("2d", { willReadFrequently: true })!;
          gctx.drawImage(video, 0, 0, g.width, g.height);
          const scan = scanPalm(gctx.getImageData(0, 0, g.width, g.height), lm, { world: result.worldLandmarks[0] ?? null });
          // Every frame maps onto the same palm layout, so creases from successive frames line up; averaging them
          // keeps the real lines and cancels noise. A sudden big move starts the average afresh.
          const px = toPixels(lm, g.width, g.height);
          const span = dist(px[INDEX[0]], px[LITTLE[0]]) || 1;
          const move = F.lastLm ? Math.max(dist(px[0], F.lastLm[0]), dist(px[9], F.lastLm[9])) / span : 1;
          if (move > 0.12) {
            F.field = null;
            F.frames = 0;
          }
          F.field = fuseFields(F.field, scan.field, 0.3);
          F.frames++;
          F.lastLm = px;
          const traced = traceAll(F.field, F.field.response);
          lastScan.current = { at: now, traced, issues: scan.issues };
          const found = traced.filter((l) => l.found).length;
          const good = !scan.issues.length && F.frames >= MIN_FRAMES && found >= 3 && move < 0.04;
          F.readySince = good ? F.readySince || now : 0;
          const pct = good ? Math.min(1, (now - F.readySince) / HOLD_MS) : 0;
          setReady((prev) => (Math.abs(prev - pct) >= 0.1 || (pct === 0) !== (prev === 0) ? pct : prev));
          if (autoRef.current && pct >= 1) {
            captureRef.current();
            return;
          }
        }
        const { traced, issues } = lastScan.current;
        const found = traced.filter((l) => l.found).length;
        const tt = tRef.current;
        say(issues.length ? tt.issues[issues[0]] : F.frames < MIN_FRAMES ? tt.steadying(F.frames, MIN_FRAMES) : found >= 3 ? (autoRef.current ? tt.holdToCapture : tt.tapShutter) : tt.holdStill);

        // Lines are kept in palm coordinates and re-projected each frame, so they stay stuck to the moving hand.
        const px = toPixels(lm, w, h);
        drawHand(ctx, px);
        if (!issues.includes("back-of-hand")) drawLines(ctx, px, traced);
      };
      tick();
    },
    [say]
  );

  async function startCamera(face = facing ?? (window.matchMedia("(pointer: coarse)").matches ? "environment" : "user")) {
    setFacing(face);
    setError(null);
    setPhase("loading");
    say(t.loadingModel);
    stopCamera();
    try {
      const [landmarker, stream] = await Promise.all([
        loadLandmarker(),
        navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }),
      ]);
      await landmarker.setOptions({ runningMode: "VIDEO" });
      fused.current = { field: null, frames: 0, lastLm: null, readySince: 0 };
      setReady(0);
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setDims({ w: video.videoWidth || 4, h: video.videoHeight || 3 });
      setPhase("live");
      loop(landmarker);
    } catch (err) {
      stopCamera();
      setPhase("idle");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? t.cameraDeclined
          : t.cameraFailed
      );
    }
  }

  /** Detects the hand on a still picture, then reads it. */
  async function readStill(canvas: HTMLCanvasElement, mirrored: boolean, prior: CreaseField | null = null) {
    setPhase("analyzing");
    try {
      const landmarker = await loadLandmarker();
      await landmarker.setOptions({ runningMode: "IMAGE" });
      const result = landmarker.detect(canvas);
      const lm = result.landmarks[0];
      if (!lm) throw new Error(t.noHand);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const px = toPixels(lm, canvas.width, canvas.height);
      setShot({
        prior,
        // A large palm in a high-resolution photo carries finer creases than the base grid can hold.
        scale: dist(px[INDEX[0]], px[LITTLE[0]]) >= 400 ? 2 : 1,
        url: canvas.toDataURL("image/jpeg", 0.9),
        width: canvas.width,
        height: canvas.height,
        pixels: ctx.getImageData(0, 0, canvas.width, canvas.height),
        landmarks: lm,
        world: result.worldLandmarks[0] ?? null,
        seen: palmHand(lm),
        mirrored,
      });
      setHandFix(null);
      setPhase("result");
      haptic("success");
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : t.readFailed);
      haptic("error");
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || phase !== "live") return;
    haptic("medium");
    const prior = fused.current.frames >= MIN_FRAMES ? fused.current.field : null;
    const mirrored = facing === "user";
    // A full-resolution still where the browser can take one (ImageCapture), otherwise the video frame.
    let source: CanvasImageSource = video;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    let done = () => {};
    const track = streamRef.current?.getVideoTracks()[0];
    const ImageCaptureCtor = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { takePhoto(): Promise<Blob> } }).ImageCapture;
    if (ImageCaptureCtor && track) {
      try {
        const blob = await new ImageCaptureCtor(track).takePhoto();
        const img = await decodeImage(new File([blob], "palm.jpg", { type: blob.type }));
        source = img.source;
        sw = img.width;
        sh = img.height;
        done = img.close;
      } catch {
        /* fall back to the video frame */
      }
    }
    const fit = Math.min(1, 2400 / Math.max(sw, sh));
    const c = document.createElement("canvas");
    c.width = Math.round(sw * fit);
    c.height = Math.round(sh * fit);
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    // Save the selfie view the way it looked on screen.
    if (mirrored) ctx.setTransform(-1, 0, 0, 1, c.width, 0);
    ctx.drawImage(source, 0, 0, c.width, c.height);
    done();
    stopCamera();
    readStill(c, mirrored, prior);
  }

  useEffect(() => {
    captureRef.current = () => void capture();
  });

  async function upload(file: File) {
    setError(null);
    stopCamera();
    setPhase("analyzing");
    try {
      const image = await decodeImage(file);
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const c = document.createElement("canvas");
      c.width = Math.round(image.width * scale);
      c.height = Math.round(image.height * scale);
      c.getContext("2d")!.drawImage(image.source, 0, 0, c.width, c.height);
      image.close();
      await readStill(c, false);
    } catch {
      setPhase("idle");
      setError(t.openFailed);
    }
  }

  function reset() {
    setShot(null);
    setAnswers({});
    setPhase("idle");
  }

  // A mirrored selfie shows a right hand as a left one, so the real hand and the hand in the picture can differ.
  const realHand = shot ? (handFix ?? (shot.mirrored ? other(shot.seen) : shot.seen)) : "Right";
  const analysis = useMemo(
    // Only a corrected hand is checked against the picture: a mismatch then means the back of the hand is showing.
    () =>
      shot
        ? analyzePalm(shot.pixels, shot.landmarks, shot.world, handFix ? (shot.mirrored ? other(handFix) : handFix) : undefined, { scale: shot.scale, prior: shot.prior, locale })
        : null,
    [shot, handFix, locale]
  );
  const kundli = useMemo<KundliGrades | null>(() => {
    const c = charts.find((x) => x.key === chartKey);
    if (!c) return null;
    try {
      return Object.fromEntries(planetDiagnosis(c.chart).map((d) => [d.planet, d.grade]));
    } catch {
      return null;
    }
  }, [charts, chartKey]);
  const mounts = useMemo(() => (shot && analysis ? mountsFor(analysis, shot.pixels, shot.landmarks, answers, kundli, locale) : []), [shot, analysis, answers, kundli, locale]);

  return (
    <div className="space-y-8">
      {phase !== "result" && (
        <div className="card-edge overflow-hidden rounded-3xl">
          <div className="relative mx-auto bg-ink-deep" style={{ aspectRatio: `${dims.w} / ${dims.h}`, maxHeight: "70vh" }}>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-contain ${phase === "live" ? "" : "invisible"}`}
              style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
            />
            <canvas
              ref={overlayRef}
              className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${phase === "live" ? "" : "invisible"}`}
              style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
            />
            {phase === "live" && (
              <>
                <p className="absolute inset-x-0 top-3 mx-auto w-fit max-w-[90%] rounded-full bg-black/60 px-4 py-1.5 text-center text-xs font-semibold text-white backdrop-blur" aria-live="polite">
                  {status}
                </p>
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      startCamera(facing === "user" ? "environment" : "user");
                    }}
                    className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur"
                  >
                    {t.flip}
                  </button>
                  <button
                    type="button"
                    onClick={() => void capture()}
                    aria-label={t.shutter}
                    className="relative h-16 w-16 rounded-full border-4 border-white bg-white/25 shadow-lg transition active:scale-90"
                  >
                    {ready > 0 && (
                      <svg viewBox="0 0 36 36" className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] -rotate-90" aria-hidden="true">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#f2c14e" strokeWidth="2.5" strokeDasharray={`${ready * 100.5} 100.5`} strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                  <button type="button" onClick={() => {
                      stopCamera();
                      setPhase("idle");
                    }} className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                    {t.close}
                  </button>
                </div>
                <label className="absolute top-14 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--color-gold)]" />
                  {t.auto}
                </label>
              </>
            )}
            {phase !== "live" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
                {phase === "idle" ? (
                  <>
                    <PalmGlyph />
                    <div className="flex flex-wrap justify-center gap-3">
                      <button type="button" onClick={() => startCamera()} className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-on-gold hover:bg-gold-bright">
                        {t.openCamera}
                      </button>
                      <label className="cursor-pointer rounded-full border border-border px-6 py-3 text-sm font-semibold text-cream hover:border-gold">
                        {t.upload}
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                      </label>
                    </div>
                    <p className="max-w-sm text-xs text-muted">{t.private}</p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-cream" aria-live="polite">
                    {phase === "loading" ? status : t.reading}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm text-rose">
          {error}
        </p>
      )}

      {phase === "result" && shot && analysis && <PalmResult
          shot={shot}
          analysis={analysis}
          mounts={mounts}
          t={t}
          onAnswer={(k, v) => {
            haptic("selection");
            setAnswers((a) => ({ ...a, [k]: v }));
          }}
          charts={charts}
          chartKey={chartKey}
          onChart={setChartKey}
          hand={realHand}
          onHand={(h) => {
            haptic("selection");
            setHandFix(h);
          }}
          onRetake={reset}
        />}
    </div>
  );
}

/** Decodes a photo upright. Older Safari lacks createImageBitmap's orientation option; an <img> applies EXIF rotation itself. */
async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  }
}

function drawHand(ctx: CanvasRenderingContext2D, px: Point[]) {
  const size = Math.hypot(px[5].x - px[17].x, px[5].y - px[17].y);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(1.5, size / 90);
  ctx.beginPath();
  for (const chain of [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [0, 17, 18, 19, 20], [5, 9, 13, 17]]) {
    chain.forEach((i, k) => (k ? ctx.lineTo(px[i].x, px[i].y) : ctx.moveTo(px[i].x, px[i].y)));
  }
  ctx.stroke();
}

function drawLines(ctx: CanvasRenderingContext2D, px: Point[], traced: TracedLine[]) {
  const frame = palmFrame(px);
  const size = Math.hypot(px[5].x - px[17].x, px[5].y - px[17].y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const line of traced) {
    if (!line.found) continue;
    for (const seg of line.segments) {
      const pts = seg.map((p) => toImage(frame, p.s, p.t));
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.strokeStyle = LINE_COLORS[line.key];
      ctx.lineWidth = Math.max(2.5, size / 45);
      ctx.beginPath();
      pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

const toPath = (pts: Point[]) => pts.map((p, k) => `${k ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");

function PalmResult({
  shot,
  analysis,
  mounts,
  t,
  onAnswer,
  charts,
  chartKey,
  onChart,
  hand,
  onHand,
  onRetake,
}: {
  shot: Shot;
  analysis: PalmAnalysis;
  mounts: MountReading[];
  t: PalmCopy;
  onAnswer: (k: MountKey, v: Fullness) => void;
  charts: StoredChart[];
  chartKey: string;
  onChart: (k: string) => void;
  hand: Hand;
  onHand: (h: Hand) => void;
  onRetake: () => void;
}) {
  const [active, setActive] = useState<LineKey | null>(null);
  const [overlay, setOverlay] = useState<"lines" | "mounts">("lines");
  const [activeMount, setActiveMount] = useState<MountKey | null>(null);
  const dominant = dominantMounts(mounts);
  const { reading, lines, issues } = analysis;
  const size = Math.max(shot.width, shot.height);
  const stroke = size / 140;
  const labels = placeLabels(lines, size);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
        <figure className="card-edge overflow-hidden rounded-3xl md:sticky md:top-24">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL from the camera */}
            <img src={shot.url} alt={t.alt} className="block h-auto w-full" />
            <svg viewBox={`0 0 ${shot.width} ${shot.height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
              {overlay === "mounts" &&
                mounts
                  .filter((m) => m.inView)
                  .map((m) => (
                    <g key={m.key} style={{ opacity: activeMount && activeMount !== m.key ? 0.25 : 1, transition: "opacity 200ms" }}>
                      <polygon points={m.outline.map((p) => `${p.x},${p.y}`).join(" ")} fill={m.strength > 0 ? "rgba(242,193,78,0.16)" : m.strength < 0 ? "rgba(239,123,118,0.14)" : "rgba(255,255,255,0.08)"} stroke="rgba(255,255,255,0.55)" strokeWidth={stroke * 0.35} strokeDasharray={`${stroke} ${stroke}`} />
                      <LineLabel at={{ x: m.centre.x, y: m.centre.y + size / 70 }} text={t.mountShort[m.key]} color={m.strength > 0 ? "#f2c14e" : m.strength < 0 ? "#ff8a80" : "#ffffff"} size={size * 0.8} delay={0} />
                      {m.markings.map((k, j) => (
                        <text key={j} x={k.at.x} y={k.at.y} textAnchor="middle" dominantBaseline="central" fontSize={size / 28} fill="#ff6bd6" stroke="rgba(0,0,0,0.8)" strokeWidth={size / 300} paintOrder="stroke">
                          {k.kind === "star" ? "✶" : "✚"}
                        </text>
                      ))}
                    </g>
                  ))}
              {overlay === "lines" && lines.map((line, i) => {
                if (!line.found) return null;
                const dim = active && active !== line.key;
                return (
                  <g key={line.key} style={{ opacity: dim ? 0.2 : 1, transition: "opacity 200ms" }}>
                    {line.segments.length > 1 && (
                      <path d={toPath(line.path)} fill="none" stroke={LINE_COLORS[line.key]} strokeOpacity={0.55} strokeWidth={stroke * 0.45} strokeDasharray={`${stroke} ${stroke * 1.6}`} strokeLinecap="round" />
                    )}
                    {line.segments.map((seg, k) => (
                      <path
                        key={k}
                        d={toPath(seg)}
                        pathLength={1}
                        fill="none"
                        stroke={LINE_COLORS[line.key]}
                        strokeWidth={active === line.key ? stroke * 1.5 : stroke}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="palm-draw"
                        style={{ animationDelay: `${i * 450 + k * 150}ms`, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.7))" }}
                      />
                    ))}
                    <LineLabel at={labels[line.key]!} text={reading.lines[i].name} color={LINE_COLORS[line.key]} size={size} delay={i * 450 + 500} />
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-center px-4 pt-4">
            <SegmentedControl
              layoutId="palm-overlay"
              value={overlay}
              onChange={(v) => {
                haptic("selection");
                setOverlay(v);
              }}
              options={[
                { value: "lines", label: t.lines },
                { value: "mounts", label: t.mounts },
              ]}
            />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-3 p-4">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {reading.lines.map((l) => (
                <li key={l.key} className={`flex items-center gap-1.5 ${l.found ? "" : "opacity-50"}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: LINE_COLORS[l.key] }} />
                  {l.name}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onRetake} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-cream hover:border-gold">
              {t.retake}
            </button>
          </figcaption>
        </figure>

        <div className="space-y-4">
          <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="Photo checks">
            {[
              [t.checks.sharp, !issues.includes("blurry")],
              [t.checks.light, !issues.includes("uneven-light") && !issues.includes("glare") && !issues.includes("too-dark") && !issues.includes("too-bright")],
              [t.checks.flat, !issues.includes("curled") && !issues.includes("tilted")],
              [t.checks.close, !issues.includes("too-small")],
              ...(shot.prior ? ([[t.checks.steadied, true]] as [string, boolean][]) : []),
            ].map(([label, ok]) => (
              <li key={label as string} className={`rounded-full border px-2.5 py-0.5 ${ok ? "border-gold/50 text-gold-bright" : "border-rose/50 text-rose"}`}>
                {ok ? "✓" : "✕"} {label}
              </li>
            ))}
          </ul>
          {issues.length > 0 && (
            <p role="status" className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-2.5 text-sm text-rose">
              {issues[0] === "back-of-hand"
                ? t.backOfHand(t.otherHand[hand])
                : `${t.issues[issues[0]]}. ${t.mayBeOff}`}
            </p>
          )}
          <section className="card-edge rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gold-bright">{t.title}</p>
              <SegmentedControl
                layoutId="palm-hand"
                value={hand}
                onChange={onHand}
                options={[
                  { value: "Right", label: t.right },
                  { value: "Left", label: t.left },
                ]}
              />
            </div>
            <p className="font-display mt-2 text-2xl text-cream md:text-3xl">{reading.summary}</p>
            {reading.element.palm && (
              <div className="mt-4 rounded-2xl border border-border/70 p-4">
                <p className="text-sm font-semibold text-cream">
                  {reading.element.name}
                  <span className="font-normal text-muted"> · {reading.element.palm}, {reading.element.fingers.toLowerCase()}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{reading.element.text}</p>
              </div>
            )}
          </section>

          {reading.lines.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => {
                haptic("selection");
                setActive((a) => (a === l.key ? null : l.key));
              }}
              aria-pressed={active === l.key}
              className={`card-edge block w-full rounded-3xl p-5 text-left transition ${active === l.key ? "ring-2 ring-gold" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: LINE_COLORS[l.key], opacity: l.found ? 1 : 0.4 }} />
                <h3 className="font-semibold text-cream">{l.name}</h3>
                {t.showHindiName && <span className="text-sm text-muted">{l.nameHi}</span>}
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {l.traits.map((t) => (
                  <li key={t} className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted">
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-muted">{l.text}</p>
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Mounts" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-cream">{t.mountsTitle}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t.mountsBody}</p>
          </div>
          {charts.length > 0 && (
            <label className="text-xs text-muted">
              {t.compare}{" "}
              <select value={chartKey} onChange={(e) => onChart(e.target.value)} className="ml-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-cream">
                <option value="">{t.none}</option>
                {charts.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.input.name || c.input.date}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {dominant.length > 0 && (
          <p className="card-edge rounded-2xl px-5 py-4 text-sm text-cream">
            {t.strongest(dominant.slice(0, 3).map((m) => t.mountShort[m.key]).join(", "), t.mountShort[dominant[0].key])}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {mounts.map((m) => (
            <div
              key={m.key}
              className={`card-edge rounded-2xl p-5 transition ${activeMount === m.key ? "ring-2 ring-gold" : ""}`}
              onMouseEnter={() => setActiveMount(m.key)}
              onMouseLeave={() => setActiveMount(null)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-cream">
                  {m.name} {t.showHindiName && <span className="text-sm font-normal text-muted">{m.nameHi}</span>}
                </h3>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${!m.inView ? "border-border text-muted" : m.sign === "star" || m.sign === "vertical" ? "border-gold/60 text-gold-bright" : m.sign === "clear" ? "border-border text-muted" : "border-rose/50 text-rose"}`}>
                  {m.inView ? t.signs[m.sign] : t.notInView}
                </span>
              </div>
              {m.pressable && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-muted">{t.pressed}</span>
                  {(["flat", "normal", "full"] as Fullness[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={m.fullness === f}
                      onClick={() => onAnswer(m.key, f)}
                      className={`rounded-full border px-2.5 py-1 ${m.fullness === f ? "border-gold bg-gold text-on-gold" : "border-border text-cream hover:border-gold"}`}
                    >
                      {t.fullness[f]}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted">{m.text}</p>
              {m.kundli && <p className="mt-2 text-sm text-cream">{m.kundli}</p>}
            </div>
          ))}
        </div>
      </section>

      {reading.fingers.length > 0 && (
        <section className="card-edge rounded-3xl p-6">
          <h2 className="text-lg font-bold text-cream">{t.fingersTitle}</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            {reading.fingers.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border/70 p-4">
                <dt className="text-xs font-semibold text-muted">{f.label}</dt>
                <dd className="mt-1 font-semibold text-cream">{f.value}</dd>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{f.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

/** Where along each line its label sits — spread apart so neighbouring lines' labels don't collide. */
const LABEL_AT: Record<LineKey, number> = { heart: 0.2, head: 0.8, life: 0.75, fate: 0.35 };

function placeLabels(lines: PalmAnalysis["lines"], size: number): Partial<Record<LineKey, Point>> {
  const fs = size / 38;
  const placed: Partial<Record<LineKey, Point>> = {};
  for (const line of lines) {
    if (!line.found) continue;
    const pts = line.segments.flat();
    let at = { ...pts[Math.min(pts.length - 1, Math.floor(pts.length * LABEL_AT[line.key]))] };
    // Nudge down past any label already placed too close.
    for (let tries = 0; tries < 4; tries++) {
      const clash = Object.values(placed).some((q) => Math.abs(q!.x - at.x) < fs * 5 && Math.abs(q!.y - at.y) < fs * 1.3);
      if (!clash) break;
      at = { x: at.x, y: at.y + fs * 1.4 };
    }
    placed[line.key] = at;
  }
  return placed;
}

function LineLabel({ at, text, color, size, delay }: { at: Point; text: string; color: string; size: number; delay: number }) {
  const fs = size / 38;
  return (
    <text
      x={at.x}
      y={at.y - fs * 0.8}
      textAnchor="middle"
      fontSize={fs}
      fontWeight={700}
      fill={color}
      stroke="rgba(0,0,0,0.75)"
      strokeWidth={fs / 5}
      paintOrder="stroke"
      className="palm-label"
      style={{ animationDelay: `${delay}ms` }}
    >
      {text}
    </text>
  );
}

function PalmGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-20 w-20 text-gold-bright" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 58c-6-5-10-12-11-20l-2-9c-.4-2 2.6-3 3.6-1l4.4 9V12c0-2.4 3.6-2.4 3.6 0v18V8c0-2.4 3.8-2.4 3.8 0v22V10c0-2.4 3.8-2.4 3.8 0v20-16c0-2.4 3.6-2.4 3.6 0v26c0 9-3 15-7 20" />
      <path d="M18 36c3-2 8-2 12 1M17 43c3 1 6 0 9-2M24 52c-1-6 0-10 3-14" opacity="0.7" />
    </svg>
  );
}
