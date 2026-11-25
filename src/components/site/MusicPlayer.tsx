import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";

export function MusicPlayer({ src, title, startSignal }: { src: string | null; title: string | null; startSignal: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a || !src) return;
    a.play().catch(() => {});
    const start = () => a.play().catch(() => {});
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, [src, startSignal]);

  if (!src) return null;
  return (
    <>
      <audio ref={ref} src={src} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button
        type="button"
        aria-label={playing ? "Jeda musik" : "Putar musik"}
        title={title ?? "Musik"}
        onClick={(e) => {
          e.stopPropagation();
          const a = ref.current;
          if (!a) return;
          if (a.paused) a.play().catch(() => {});
          else a.pause();
        }}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Music className="h-5 w-5 animate-pulse" />}
      </button>
    </>
  );
}
