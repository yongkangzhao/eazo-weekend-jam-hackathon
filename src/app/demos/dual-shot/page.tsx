"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ─── Types & Constants ───────────────────────────────────────────── */

type Screen = "setup" | "recording" | "review" | "metadata";

const TAGS = [
  "vlog",
  "tutorial",
  "reaction",
  "product review",
  "challenge",
  "cooking",
  "travel",
  "gaming",
  "beauty",
  "fitness",
] as const;

const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function getSupportedMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── SetupScreen ─────────────────────────────────────────────────── */

function SetupScreen({
  onCameraReady,
}: {
  onCameraReady: (
    backStream: MediaStream,
    frontStream: MediaStream | null
  ) => void;
}) {
  const [checking, setChecking] = useState(true);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const hasGetUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    const hasMediaRecorder = typeof MediaRecorder !== "undefined";
    const hasCaptureStream = !!(
      HTMLCanvasElement.prototype as HTMLCanvasElement & {
        captureStream?: unknown;
      }
    ).captureStream;
    setSupported(hasGetUserMedia && hasMediaRecorder && hasCaptureStream);
    setChecking(false);
  }, []);

  const handleStart = useCallback(async () => {
    setRequesting(true);
    setError(null);
    try {
      const backStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      let frontStream: MediaStream | null = null;
      try {
        frontStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
      } catch {
        // Front camera not available — single camera mode
      }

      onCameraReady(backStream, frontStream);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("permission-denied");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to access camera"
        );
      }
    } finally {
      setRequesting(false);
    }
  }, [onCameraReady]);

  if (checking) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F5F5F0" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "#FFF1F2" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E11D48"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "#1A1D23" }}
          >
            DualShot
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
            Record with both cameras. One take, two angles.
          </p>
        </div>

        {!supported ? (
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "#FFFFFF",
              borderColor: "#E5E7EB",
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: "#1A1D23" }}
            >
              Browser not supported
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              DualShot requires a modern mobile browser with camera access,
              MediaRecorder, and canvas capture support. Try Chrome or Safari on
              your phone.
            </p>
          </div>
        ) : error === "permission-denied" ? (
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "#FFF1F2",
              borderColor: "#FECDD3",
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: "#E11D48" }}
            >
              Camera access denied
            </p>
            <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
              DualShot needs camera and microphone permissions to record.
            </p>
            <div className="text-xs space-y-1" style={{ color: "#6B7280" }}>
              <p>
                <strong>iOS Safari:</strong> Settings &gt; Safari &gt; Camera
                &gt; Allow
              </p>
              <p>
                <strong>Android Chrome:</strong> Tap the lock icon in the address
                bar &gt; Permissions
              </p>
              <p>
                <strong>Desktop:</strong> Click the camera icon in the address
                bar
              </p>
            </div>
            <button
              onClick={handleStart}
              className="mt-4 w-full rounded-xl py-3 text-sm font-semibold"
              style={{ background: "#E11D48", color: "#FFFFFF" }}
            >
              Try Again
            </button>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "#FFF1F2",
              borderColor: "#FECDD3",
            }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: "#E11D48" }}
            >
              Camera error
            </p>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {error}
            </p>
            <button
              onClick={handleStart}
              className="mt-4 w-full rounded-xl py-3 text-sm font-semibold"
              style={{ background: "#E11D48", color: "#FFFFFF" }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
          >
            <button
              onClick={handleStart}
              disabled={requesting}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
              style={{
                background: requesting ? "#FDA4AF" : "#E11D48",
                color: "#FFFFFF",
                cursor: requesting ? "wait" : "pointer",
              }}
            >
              {requesting ? "Requesting access..." : "Start Camera"}
            </button>
          </div>
        )}

        <p
          className="text-center text-xs mt-6"
          style={{ color: "#9CA3AF" }}
        >
          Record dual-camera content with AI-powered metadata
        </p>
      </div>
    </div>
  );
}

/* ─── RecordingScreen ─────────────────────────────────────────────── */

function RecordingScreen({
  backStream,
  frontStream,
  onRecordingComplete,
  onBack,
}: {
  backStream: MediaStream;
  frontStream: MediaStream | null;
  onRecordingComplete: (blob: Blob) => void;
  onBack: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backVideoRef = useRef<HTMLVideoElement>(null);
  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pipPosRef = useRef({ x: 16, y: 16 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [singleCameraMode, setSingleCameraMode] = useState(!frontStream);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up video elements and start compositing loop
  useEffect(() => {
    const backVideo = backVideoRef.current;
    const frontVideo = frontVideoRef.current;
    const canvas = canvasRef.current;
    if (!backVideo || !canvas) return;

    backVideo.srcObject = backStream;
    backVideo.play().catch(() => {});

    if (frontStream && frontVideo) {
      frontVideo.srcObject = frontStream;
      frontVideo.play().catch(() => {});
    } else {
      setSingleCameraMode(true);
    }

    // Set canvas resolution from back camera once metadata loads
    const handleMetadata = () => {
      canvas.width = backVideo.videoWidth || 1920;
      canvas.height = backVideo.videoHeight || 1080;
    };
    backVideo.addEventListener("loadedmetadata", handleMetadata);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvas.width || !canvas.height) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const cw = canvas.width;
      const ch = canvas.height;

      // Draw back camera (cover fit)
      if (backVideo.readyState >= 2) {
        const vw = backVideo.videoWidth;
        const vh = backVideo.videoHeight;
        const scale = Math.max(cw / vw, ch / vh);
        const sw = cw / scale;
        const sh = ch / scale;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;
        ctx.drawImage(backVideo, sx, sy, sw, sh, 0, 0, cw, ch);
      }

      // Draw front camera PiP (if available)
      if (
        frontVideo &&
        frontVideo.readyState >= 2 &&
        !singleCameraMode
      ) {
        const pipW = Math.round(cw * 0.28);
        const pipH = Math.round(
          pipW * (frontVideo.videoHeight / frontVideo.videoWidth)
        );
        const pipX = pipPosRef.current.x;
        const pipY = pipPosRef.current.y;
        const radius = 16;

        ctx.save();

        // Rounded rectangle clip
        ctx.beginPath();
        ctx.moveTo(pipX + radius, pipY);
        ctx.lineTo(pipX + pipW - radius, pipY);
        ctx.quadraticCurveTo(pipX + pipW, pipY, pipX + pipW, pipY + radius);
        ctx.lineTo(pipX + pipW, pipY + pipH - radius);
        ctx.quadraticCurveTo(
          pipX + pipW,
          pipY + pipH,
          pipX + pipW - radius,
          pipY + pipH
        );
        ctx.lineTo(pipX + radius, pipY + pipH);
        ctx.quadraticCurveTo(pipX, pipY + pipH, pipX, pipY + pipH - radius);
        ctx.lineTo(pipX, pipY + radius);
        ctx.quadraticCurveTo(pipX, pipY, pipX + radius, pipY);
        ctx.closePath();

        // White border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.clip();

        // Flip horizontally for mirror effect
        ctx.translate(pipX + pipW, pipY);
        ctx.scale(-1, 1);
        ctx.drawImage(frontVideo, 0, 0, pipW, pipH);

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      backVideo.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, [backStream, frontStream, singleCameraMode]);

  // PiP drag handling
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (singleCameraMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      const pipW = Math.round(canvas.width * 0.28);
      const pipH = Math.round(
        pipW *
          ((frontVideoRef.current?.videoHeight || 480) /
            (frontVideoRef.current?.videoWidth || 640))
      );
      const px = pipPosRef.current.x;
      const py = pipPosRef.current.y;

      if (cx >= px && cx <= px + pipW && cy >= py && cy <= py + pipH) {
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: cx - px, y: cy - py };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [singleCameraMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      pipPosRef.current = {
        x: cx - dragOffsetRef.current.x,
        y: cy - dragOffsetRef.current.y,
      };
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const pipW = Math.round(cw * 0.28);
    const pipH = Math.round(
      pipW *
        ((frontVideoRef.current?.videoHeight || 480) /
          (frontVideoRef.current?.videoWidth || 640))
    );
    const margin = 16;
    const cx = pipPosRef.current.x + pipW / 2;
    const cy = pipPosRef.current.y + pipH / 2;

    // Snap to nearest corner
    const snapX = cx < cw / 2 ? margin : cw - pipW - margin;
    const snapY = cy < ch / 2 ? margin : ch - pipH - margin;
    pipPosRef.current = { x: snapX, y: snapY };
  }, []);

  // Recording controls
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mime = getSupportedMime();
    if (!mime) return;

    const canvasStream = (
      canvas as HTMLCanvasElement & {
        captureStream(fps: number): MediaStream;
      }
    ).captureStream(30);

    // Add audio tracks from back camera
    const audioTracks = backStream.getAudioTracks();
    for (const track of audioTracks) {
      canvasStream.addTrack(track);
    }

    const recorder = new MediaRecorder(canvasStream, { mimeType: mime });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      onRecordingComplete(blob);
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    setPaused(false);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [backStream, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state === "recording") {
      recorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setPaused(true);
    } else if (recorderRef.current.state === "paused") {
      recorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      setPaused(false);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "#000000" }}
    >
      {/* Pulsing REC animation */}
      <style>{`
        @keyframes dualshot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Hidden video elements */}
      <video
        ref={backVideoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <video
        ref={frontVideoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}
      >
        <button
          onClick={onBack}
          className="text-sm font-medium px-3 py-1.5 rounded-lg"
          style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.15)" }}
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          {recording && (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: "#E11D48",
                  animation: "dualshot-pulse 1.2s ease-in-out infinite",
                }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "#E11D48" }}
              >
                REC
              </span>
            </>
          )}
          <span
            className="text-sm font-mono"
            style={{ color: "#FFFFFF" }}
          >
            {formatTime(elapsed)}
          </span>
        </div>
        {singleCameraMode && (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}
          >
            Single camera
          </span>
        )}
        {!singleCameraMode && <div style={{ width: 80 }} />}
      </div>

      {/* Canvas — fills screen */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full"
        style={{ objectFit: "cover" }}
      />

      {/* Transparent overlay for PiP drag */}
      <div
        className="absolute inset-0 z-5"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-8 pb-10 pt-6"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}
      >
        {/* Pause button */}
        {recording && (
          <button
            onClick={togglePause}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {paused ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#FFFFFF"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#FFFFFF"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </button>
        )}

        {/* Record / Stop button */}
        <button
          onClick={recording ? stopRecording : startRecording}
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: recording ? "none" : "4px solid #FFFFFF",
            background: "#E11D48",
          }}
        >
          {recording ? (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: "#FFFFFF",
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#E11D48",
              }}
            />
          )}
        </button>

        {/* Spacer to balance pause button */}
        {recording && <div style={{ width: 48 }} />}
      </div>
    </div>
  );
}

/* ─── ReviewScreen ────────────────────────────────────────────────── */

function ReviewScreen({
  blob,
  onReRecord,
  onContinue,
}: {
  blob: Blob;
  onReRecord: () => void;
  onContinue: () => void;
}) {
  const videoUrlRef = useRef<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    videoUrlRef.current = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "#F5F5F0" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "#1A1D23" }}
          >
            Review your clip
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            {(blob.size / (1024 * 1024)).toFixed(1)} MB
          </p>
        </div>

        <div
          className="rounded-2xl border overflow-hidden mb-5"
          style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
        >
          {videoUrlRef.current && (
            <video
              src={videoUrlRef.current}
              controls
              autoPlay
              playsInline
              className="w-full"
              style={{ maxHeight: "60vh" }}
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onReRecord}
            className="flex-1 rounded-xl border py-3 text-sm font-semibold"
            style={{
              borderColor: "#E5E7EB",
              color: "#6B7280",
              background: "#FFFFFF",
            }}
          >
            Re-record
          </button>
          <button
            onClick={onContinue}
            className="flex-1 rounded-xl py-3 text-sm font-semibold"
            style={{ background: "#E11D48", color: "#FFFFFF" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MetadataScreen ──────────────────────────────────────────────── */

function MetadataScreen({
  blob,
  onBack,
}: {
  blob: Blob;
  onBack: () => void;
}) {
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [genDescription, setGenDescription] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }, []);

  const generate = useCallback(async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/dual-shot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          tags: selectedTags,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setTitle(data.title || "");
      setGenDescription(data.description || "");
      setHasGenerated(true);
    } catch {
      setGenError("AI generation failed. You can type your title and description manually.");
    } finally {
      setGenerating(false);
    }
  }, [description, selectedTags]);

  const handleDownload = useCallback(() => {
    const filename = title.trim()
      ? `${slugify(title)}.webm`
      : "dualshot-recording.webm";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [blob, title]);

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: "#F5F5F0" }}
    >
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "#1A1D23" }}
          >
            Add details
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            Describe your video and let AI craft the metadata
          </p>
        </div>

        {/* Description input */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
        >
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your video in one line..."
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
            style={{
              borderColor: "#E5E7EB",
              color: "#1A1D23",
              background: "#FFFFFF",
            }}
            maxLength={200}
          />
        </div>

        {/* Tags */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
        >
          <label
            className="block text-xs font-medium mb-2 uppercase tracking-wider"
            style={{ color: "#6B7280" }}
          >
            Tags (up to 3)
          </label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: isSelected ? "#E11D48" : "#E5E7EB",
                    background: isSelected ? "#FFF1F2" : "#FFFFFF",
                    color: isSelected ? "#E11D48" : "#6B7280",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!description.trim() || generating}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
          style={{
            background:
              description.trim() && !generating ? "#E11D48" : "#FDA4AF",
            color: "#FFFFFF",
            cursor:
              description.trim() && !generating ? "pointer" : "not-allowed",
          }}
        >
          {generating ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </span>
          ) : hasGenerated ? (
            "Regenerate"
          ) : (
            "Generate Title & Description"
          )}
        </button>

        {/* Error */}
        {genError && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              background: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
            }}
          >
            {genError}
          </div>
        )}

        {/* Generated fields */}
        {hasGenerated && (
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}
          >
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: "#6B7280" }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#1A1D23",
                  background: "#FFFFFF",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: "#6B7280" }}
              >
                Description
              </label>
              <textarea
                value={genDescription}
                onChange={(e) => setGenDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#1A1D23",
                  background: "#FFFFFF",
                }}
              />
            </div>
          </div>
        )}

        {/* Download */}
        <button
          onClick={handleDownload}
          className="w-full rounded-xl py-3 text-sm font-semibold"
          style={{ background: "#1A1A1A", color: "#FFFFFF" }}
        >
          Download Video ({(blob.size / (1024 * 1024)).toFixed(1)} MB)
        </button>

        {/* Back to review */}
        <button
          onClick={onBack}
          className="w-full rounded-xl border py-3 text-sm font-medium"
          style={{
            borderColor: "#E5E7EB",
            color: "#6B7280",
            background: "#FFFFFF",
          }}
        >
          Back to review
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export default function DualShotPage() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [backStream, setBackStream] = useState<MediaStream | null>(null);
  const [frontStream, setFrontStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Cleanup all streams on unmount
  useEffect(() => {
    return () => {
      backStream?.getTracks().forEach((t) => t.stop());
      frontStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraReady = useCallback(
    (back: MediaStream, front: MediaStream | null) => {
      setBackStream(back);
      setFrontStream(front);
      setScreen("recording");
    },
    []
  );

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setRecordedBlob(blob);
    setScreen("review");
  }, []);

  const handleReRecord = useCallback(() => {
    if (recordedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
    }
    setRecordedBlob(null);
    setScreen("recording");
  }, [recordedBlob]);

  const stopAllStreams = useCallback(() => {
    backStream?.getTracks().forEach((t) => t.stop());
    frontStream?.getTracks().forEach((t) => t.stop());
    setBackStream(null);
    setFrontStream(null);
  }, [backStream, frontStream]);

  if (screen === "recording" && backStream) {
    return (
      <RecordingScreen
        backStream={backStream}
        frontStream={frontStream}
        onRecordingComplete={handleRecordingComplete}
        onBack={() => {
          stopAllStreams();
          setScreen("setup");
        }}
      />
    );
  }

  if (screen === "review" && recordedBlob) {
    return (
      <ReviewScreen
        blob={recordedBlob}
        onReRecord={handleReRecord}
        onContinue={() => setScreen("metadata")}
      />
    );
  }

  if (screen === "metadata" && recordedBlob) {
    return (
      <MetadataScreen
        blob={recordedBlob}
        onBack={() => setScreen("review")}
      />
    );
  }

  return <SetupScreen onCameraReady={handleCameraReady} />;
}
