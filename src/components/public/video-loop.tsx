"use client";

import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/**
 * A self-hosted video that loops continuously as ambient footage, with the
 * sound off until someone asks for it.
 *
 * Autoplay is only permitted while muted — every browser blocks a video that
 * starts making noise on its own — so the track starts muted and unmuting is
 * a deliberate click. That is also the courteous behaviour: a page that
 * starts talking at you is a page people close.
 *
 * A pause control sits alongside it because looping motion is not something
 * everyone can comfortably ignore, and `prefers-reduced-motion` is honoured
 * by not autoplaying at all for those who have asked for less movement.
 */
export function VideoLoop({
  src,
  poster,
  label,
}: {
  src: string;
  poster?: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  function toggleSound() {
    const el = ref.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    // Unmuting counts as the user gesture browsers require, so a video that
    // was blocked from autoplaying will start here.
    if (!next && el.paused) void el.play().catch(() => {});
    setMuted(next);
  }

  function togglePlay() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        className="block h-full w-full object-cover motion-reduce:[animation:none]"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="absolute right-4 bottom-4 flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="video-control"
          aria-pressed={!playing}
        >
          {playing ? (
            <Pause size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
          <span className="sr-only">{playing ? "Pause the video" : "Play the video"}</span>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          className="video-control"
          aria-pressed={!muted}
        >
          {muted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} aria-hidden="true" />
          )}
          <span className="sr-only">
            {muted ? "Turn the sound on" : "Turn the sound off"}
          </span>
          <span aria-hidden="true" className="text-micro ml-1.5 hidden sm:inline">
            {muted ? "Sound off" : "Sound on"}
          </span>
        </button>
      </div>
    </div>
  );
}
