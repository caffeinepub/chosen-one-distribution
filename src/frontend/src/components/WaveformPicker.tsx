import { useEffect, useRef, useState } from "react";

interface WaveformPickerProps {
  audioFile: File | null;
  previewStartSeconds: number;
  onPreviewStartChange: (seconds: number) => void;
  audioDuration: number;
}

const PREVIEW_DURATION = 30;
const CANVAS_HEIGHT = 80;
const WAVEFORM_COLOR = "rgba(212, 175, 55, 0.35)";
const PREVIEW_COLOR = "rgba(212, 175, 55, 0.9)";
const PREVIEW_FILL = "rgba(212, 175, 55, 0.12)";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WaveformPicker({
  audioFile,
  previewStartSeconds,
  onPreviewStartChange,
  audioDuration,
}: WaveformPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef<number>(0);
  const dragStartSeconds = useRef<number>(0);

  // Decode audio and extract peaks
  useEffect(() => {
    if (!audioFile) {
      setPeaks([]);
      return;
    }

    let cancelled = false;
    setIsAnalyzing(true);

    const processPeaks = async () => {
      try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioCtx = new OfflineAudioContext(1, 1, 44100);
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const data = decoded.getChannelData(0);
        const numBars = 200;
        const blockSize = Math.floor(data.length / numBars);
        const extractedPeaks: number[] = [];

        for (let i = 0; i < numBars; i++) {
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            const val = Math.abs(data[i * blockSize + j] ?? 0);
            if (val > max) max = val;
          }
          extractedPeaks.push(max);
        }

        if (!cancelled) {
          setPeaks(extractedPeaks);
        }
      } catch {
        if (!cancelled) setPeaks([]);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    };

    processPeaks();
    return () => {
      cancelled = true;
    };
  }, [audioFile]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = CANVAS_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (peaks.length === 0) return;

    const barWidth = width / peaks.length;
    const midY = height / 2;
    const maxPeak = Math.max(...peaks, 0.01);

    // Determine preview region in pixel space
    const previewStart =
      audioDuration > 0 ? (previewStartSeconds / audioDuration) * width : 0;
    const previewEnd =
      audioDuration > 0
        ? (Math.min(previewStartSeconds + PREVIEW_DURATION, audioDuration) /
            audioDuration) *
          width
        : 0;

    // Draw preview fill
    if (audioDuration > 0) {
      ctx.fillStyle = PREVIEW_FILL;
      ctx.beginPath();
      ctx.roundRect(previewStart, 0, previewEnd - previewStart, height, 4);
      ctx.fill();
    }

    // Draw bars
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barH = Math.max(2, (peak / maxPeak) * (height * 0.85));
      const inPreview =
        audioDuration > 0 && x >= previewStart && x <= previewEnd;

      ctx.fillStyle = inPreview ? PREVIEW_COLOR : WAVEFORM_COLOR;
      const bw = Math.max(1, barWidth - 1);
      ctx.beginPath();
      ctx.roundRect(x + (barWidth - bw) / 2, midY - barH / 2, bw, barH, 1);
      ctx.fill();
    });

    // Draw preview border lines
    if (audioDuration > 0) {
      ctx.strokeStyle = "rgba(212, 175, 55, 0.8)";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(previewStart, 0);
      ctx.lineTo(previewStart, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(previewEnd, 0);
      ctx.lineTo(previewEnd, height);
      ctx.stroke();
    }
  }, [peaks, previewStartSeconds, audioDuration]);

  const getSecondsFromX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas || audioDuration <= 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const clicked = ratio * audioDuration;
    // Center the window on click, then clamp
    const start = clicked;
    return Math.max(0, Math.min(start, audioDuration - PREVIEW_DURATION));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (audioDuration <= 0) return;
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartSeconds.current = previewStartSeconds;
    onPreviewStartChange(getSecondsFromX(e.clientX));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || audioDuration <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const deltaPx = e.clientX - dragStartX.current;
    const deltaSeconds = (deltaPx / rect.width) * audioDuration;
    const newStart = dragStartSeconds.current + deltaSeconds;
    const clamped = Math.max(
      0,
      Math.min(newStart, audioDuration - PREVIEW_DURATION),
    );
    onPreviewStartChange(clamped);
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (audioDuration <= 0 || !e.touches[0]) return;
    setDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartSeconds.current = previewStartSeconds;
    onPreviewStartChange(getSecondsFromX(e.touches[0].clientX));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragging || audioDuration <= 0 || !e.touches[0]) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const deltaPx = e.touches[0].clientX - dragStartX.current;
    const deltaSeconds = (deltaPx / rect.width) * audioDuration;
    const newStart = dragStartSeconds.current + deltaSeconds;
    const clamped = Math.max(
      0,
      Math.min(newStart, audioDuration - PREVIEW_DURATION),
    );
    onPreviewStartChange(clamped);
  };

  const handleTouchEnd = () => setDragging(false);

  const previewEnd = Math.min(
    previewStartSeconds + PREVIEW_DURATION,
    audioDuration,
  );

  return (
    <div ref={containerRef} className="space-y-2">
      <div
        className="relative w-full rounded-xl overflow-hidden border border-gold/20 bg-black/40"
        style={{ height: CANVAS_HEIGHT }}
      >
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-gold text-xs tracking-widest animate-pulse">
              Analyzing waveform...
            </span>
          </div>
        )}

        {!audioFile && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gold/40 text-xs">
              Select an audio file to set preview
            </span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            cursor:
              audioDuration > 0
                ? dragging
                  ? "grabbing"
                  : "crosshair"
                : "default",
            touchAction: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {audioDuration > 0 && (
        <p className="text-xs text-gold/70">
          Preview starts at{" "}
          <span className="text-gold font-medium">
            {formatTime(previewStartSeconds)}
          </span>{" "}
          &mdash;{" "}
          <span className="text-gold font-medium">
            {formatTime(previewEnd)}
          </span>{" "}
          ({PREVIEW_DURATION}s clip)
        </p>
      )}
    </div>
  );
}
