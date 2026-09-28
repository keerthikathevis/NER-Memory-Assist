import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, Camera, CameraOff, RotateCcw, ShieldCheck } from 'lucide-react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

type Point = { x: number; y: number; z?: number; visibility?: number };
type PoseResult = { landmarks?: Point[][] };

const MODEL_URL = '/mediapipe/pose_landmarker_full.task';
const WASM_URL = '/mediapipe/wasm';

const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [28, 30], [30, 32],
];

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a: Point, b: Point, c: Point) => {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return mag ? Math.round((Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI) : 0;
};


function SectionCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-3xl border bg-[hsl(var(--card))] p-5 shadow-sm ${className}`}>{children}</section>;
}

function PageIntro({ icon: Icon, title, hint }: { icon: typeof Activity; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-[hsl(var(--primary)/.1)] p-3 text-[hsl(var(--primary))]"><Icon size={24} /></div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{hint}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border bg-[hsl(var(--card))] p-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{detail}</p>
    </div>
  );
}

export function MotionTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<{ time: number; wristX: number; wristY: number } | null>(null);
  const speedSamplesRef = useRef<number[]>([]);
  const shoulderSamplesRef = useRef<number[]>([]);
  const elbowStateRef = useRef<'up' | 'down'>('down');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(0);
  const [leftElbow, setLeftElbow] = useState(0);
  const [rightElbow, setRightElbow] = useState(0);
  const [shoulderRom, setShoulderRom] = useState(0);
  const [shoulderMovement, setShoulderMovement] = useState(0);
  const [wristSpeed, setWristSpeed] = useState(0);
  const [repetitions, setRepetitions] = useState(0);
  const [fatigue, setFatigue] = useState('Stable');
  const [reactionTime, setReactionTime] = useState('—');
  const [goAt, setGoAt] = useState<number | null>(null);
  const goAtRef = useRef<number | null>(null);

  const stop = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const draw = (landmarks: Point[][]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const points = landmarks[0];
    if (!canvas || !video || !points?.length) return;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#7c3aed';
    ctx.fillStyle = '#f59e0b';
    CONNECTIONS.forEach(([a, b]) => {
      const p = points[a], q = points[b];
      if ((p?.visibility ?? 0) < 0.35 || (q?.visibility ?? 0) < 0.35) return;
      ctx.beginPath();
      ctx.moveTo(p.x * width, p.y * height);
      ctx.lineTo(q.x * width, q.y * height);
      ctx.stroke();
    });
    points.forEach((p) => {
      if ((p.visibility ?? 0) < 0.35) return;
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const process = (result: PoseResult, now: number) => {
    const points = result.landmarks?.[0];
    if (!points) return;
    const visible = points.filter((p) => (p.visibility ?? 0) >= 0.35).length;
    setTracking(Math.round((visible / 33) * 100));
    draw(result.landmarks ?? []);

    const lShoulder = points[11], rShoulder = points[12], lElbow = points[13], rElbow = points[14];
    const lWrist = points[15], rWrist = points[16], lHip = points[23], rHip = points[24];
    if (![lShoulder, rShoulder, lElbow, rElbow, lWrist, rWrist, lHip, rHip].every(Boolean)) return;

    const leftAngle = angle(lShoulder, lElbow, lWrist);
    const rightAngle = angle(rShoulder, rElbow, rWrist);
    setLeftElbow(leftAngle);
    setRightElbow(rightAngle);

    const shoulders = distance(lShoulder, rShoulder);
    shoulderSamplesRef.current.push(shoulders);
    if (shoulderSamplesRef.current.length > 120) shoulderSamplesRef.current.shift();
    const minShoulder = Math.min(...shoulderSamplesRef.current);
    const maxShoulder = Math.max(...shoulderSamplesRef.current);
    setShoulderRom(Math.round((maxShoulder - minShoulder) * 100));
    setShoulderMovement(Math.round(Math.abs(lShoulder.y - rShoulder.y) * 100));

    const wrist = distance(lWrist, rWrist);
    if (lastFrameRef.current) {
      const dt = Math.max(0.016, (now - lastFrameRef.current.time) / 1000);
      const dx = lWrist.x - lastFrameRef.current.wristX;
      const dy = lWrist.y - lastFrameRef.current.wristY;
      const speed = Math.hypot(dx, dy) / dt;
      const pxPerSecond = Math.round(speed * 100);
      setWristSpeed(pxPerSecond);
      speedSamplesRef.current.push(pxPerSecond);
      if (speedSamplesRef.current.length > 120) speedSamplesRef.current.shift();

      const reactionStart = goAtRef.current;
      if (reactionStart !== null && now >= reactionStart && speed > 10 && !reactionTime.includes('ms')) {
        setReactionTime(String(Math.round(now - reactionStart)) + ' ms');
        goAtRef.current = null;
      }
    }
    lastFrameRef.current = { time: now, wristX: lWrist.x, wristY: lWrist.y };

    const elbow = Math.min(leftAngle, rightAngle);
    if (elbow < 80) elbowStateRef.current = 'up';
    if (elbow > 150 && elbowStateRef.current === 'up') {
      setRepetitions((value) => value + 1);
      elbowStateRef.current = 'down';
    }

    const recent = speedSamplesRef.current;
    if (recent.length >= 40) {
      const first = recent.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
      const last = recent.slice(-20).reduce((a, b) => a + b, 0) / 20;
      setFatigue(last < first * 0.65 ? 'Movement slowing' : last < first * 0.82 ? 'Possible fatigue trend' : 'Stable');
    }
  };

  const start = async () => {
    setError('');
    setLoading(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error('Camera preview is unavailable.');
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const resolver = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarkerRef.current = await PoseLandmarker.createFromOptions(resolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      setRunning(true);
      const startTime = performance.now();
      const reactionStart = startTime + 3000;
      goAtRef.current = reactionStart;
      setGoAt(reactionStart);
      setRepetitions(0);
      setReactionTime('—');
      speedSamplesRef.current = [];
      shoulderSamplesRef.current = [];
      lastFrameRef.current = null;

      const frame = () => {
        if (!videoRef.current || !landmarkerRef.current) return;
        const now = performance.now();
        const result = landmarkerRef.current.detectForVideo(videoRef.current, now);
        process(result, now);
        animationRef.current = requestAnimationFrame(frame);
      };
      animationRef.current = requestAnimationFrame(frame);
    } catch (cause) {
      stop();
      setError(cause instanceof Error ? cause.message : 'Unable to start motion tracking.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRepetitions(0);
    setReactionTime('—');
    setShoulderRom(0);
    setShoulderMovement(0);
    setWristSpeed(0);
    setFatigue('Stable');
    speedSamplesRef.current = [];
    shoulderSamplesRef.current = [];
    goAtRef.current = null;
    setGoAt(null);
  };

  return (
    <div className="gentle-in space-y-5">
      <PageIntro icon={Activity} title="Motion Tracking" hint="Real-time webcam pose tracking for movement exercises and rehabilitation support." />
      <SectionCard className="border border-[hsl(var(--primary)/.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Camera movement session</h3>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Allow camera access and stand where your upper body and arms are visible.</p>
          </div>
          <div className="flex gap-2">
            {!running ? <button onClick={start} disabled={loading} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]"><Camera size={18} />{loading ? 'Loading pose model…' : 'Start camera'}</button> : <button onClick={stop} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><CameraOff size={18} />Stop</button>}
            <button onClick={reset} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw size={18} />Reset</button>
          </div>
        </div>
        {error && <div className="mt-4 rounded-2xl border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.08)] p-4 font-semibold">{error}</div>}
        <div className="relative mt-5 overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} muted playsInline className="block aspect-video w-full object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          {!running && <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-6 text-center text-white"><div><Camera size={42} className="mx-auto mb-3" /><p className="text-lg font-bold">Camera is off</p><p className="mt-1 text-sm opacity-85">Your video stays in this browser while tracking is active.</p></div></div>}
          {running && goAt && performance.now() < goAt && <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white px-5 py-2 font-bold text-black">GO in 3 seconds</div>}
        </div>
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracking quality" value={tracking + '%'} detail="Visible landmarks" />
        <StatCard label="Left elbow" value={leftElbow + '°'} detail="Flexion / extension" />
        <StatCard label="Right elbow" value={rightElbow + '°'} detail="Flexion / extension" />
        <StatCard label="Shoulder ROM" value={shoulderRom + '%'} detail="Observed range" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Shoulder movement" value={shoulderMovement + '%'} detail="Live asymmetry measure" />
        <StatCard label="Wrist speed" value={wristSpeed + ' u/s'} detail="Normalized trajectory speed" />
        <StatCard label="Repetitions" value={String(repetitions)} detail="Elbow movement cycles" />
        <StatCard label="Reaction time" value={reactionTime} detail="First detected movement after GO" />
      </div>

      <SectionCard>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" />
          <div>
            <h3 className="font-bold">Movement trend</h3>
            <p className="mt-1 text-lg font-semibold">{fatigue}</p>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">This is an experimental movement-speed trend, not a medical diagnosis. Use it as a session measurement and discuss concerning changes with a qualified professional.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
