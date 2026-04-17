"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  src: string;
  poster?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, poster }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // FIX: initialize useRef with null (required — no-arg useRef is a TypeScript error)
  const hideTimer    = useRef<NodeJS.Timeout | null>(null);
  const seekingRef   = useRef<boolean>(false);

  const [playing,      setPlaying]      = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [buffered,     setBuffered]      = useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [muted,        setMuted]        = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  // FIX: always guard clearTimeout — null is not assignable to NodeJS.Timeout
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2800);
    }
  }, [playing]);

  // FIX: guard clearTimeout in cleanup
  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 5);
          resetHideTimer();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 5);
          resetHideTimer();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    function onFsChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
    resetHideTimer();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function setVolumeLevel(val: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted  = val === 0;
    setVolume(val);
    setMuted(val === 0);
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    resetHideTimer();
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || seekingRef.current) return;
    setCurrentTime(v.currentTime);
    if (v.duration) setProgress((v.currentTime / v.duration) * 100);
  }

  function onProgress() {
    const v = videoRef.current;
    if (!v || !v.duration || !v.buffered.length) return;
    setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
    setLoading(false);
  }

  function onWaiting()  { setLoading(true); }
  function onCanPlay()  { setLoading(false); }
  function onPlaying()  { setLoading(false); setPlaying(true); resetHideTimer(); }

  // FIX: onPause was missing closing brace in previous version
  function onPause() {
    setPlaying(false);
    setShowControls(true);
    // FIX: null guard on clearTimeout
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  function onEnded()    { setPlaying(false); setShowControls(true); setProgress(100); }
  function onError()    { setError(true);    setLoading(false); }

  const controlsVisible = showControls || !playing;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none focus:outline-none"
      tabIndex={0}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full max-h-[70vh] object-contain cursor-pointer"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        onProgress={onProgress}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />

      {/* Buffering spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/40 text-sm">Unable to load video</p>
        </div>
      )}

      {/* Centre play button */}
      {!playing && !loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            className="pointer-events-auto w-16 h-16 rounded-full bg-amber-400/90 flex items-center justify-center shadow-lg hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all duration-150"
            onClick={togglePlay}
            aria-label="Play"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="black">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
        }}
      >
        {/* Progress bar */}
        <div
          className="mx-3 mb-2 relative h-4 flex items-center cursor-pointer group"
          onClick={seekTo}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-1.5 transition-all duration-150">
            <div
              className="absolute top-0 left-0 h-full bg-white/25 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-amber-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-3 pb-3">
          <button
            onClick={togglePlay}
            className="text-white/80 hover:text-white transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
            className="hidden sm:block w-16 h-1 accent-amber-400 cursor-pointer"
            aria-label="Volume"
          />

          <span className="text-white/40 text-xs tabular-nums">
            {formatTime(currentTime)}
            {duration > 0 && (
              <span className="text-white/20"> / {formatTime(duration)}</span>
            )}
          </span>

          <button
            onClick={toggleFullscreen}
            className="ml-auto text-white/60 hover:text-white transition-colors"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
