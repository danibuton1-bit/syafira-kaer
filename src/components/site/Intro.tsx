import { useEffect, useState } from "react";

export function Intro({ onEnter }: { onEnter: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("fira-intro")) setShow(true);
  }, []);
  if (!show) return null;
  const text = "fira kaer";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-background">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="float-heart text-primary"
          style={{ left: `${(i * 7.3) % 100}%`, fontSize: `${14 + ((i * 5) % 22)}px`, animationDuration: `${7 + (i % 5)}s`, animationDelay: `${i * 0.4}s` }}
        >
          ♥
        </span>
      ))}
      <h1 className="font-script text-7xl md:text-9xl">
        {text.split("").map((c, i) => (
          <span key={i} className="intro-letter" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="shine-text px-1">{c === " " ? "\u00a0" : c}</span>
          </span>
        ))}
      </h1>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("fira-intro", "1");
          setShow(false);
          onEnter();
        }}
        className="fade-up mt-10 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
        style={{ animationDelay: "1.4s" }}
      >
        Masuk 💕
      </button>
    </div>
  );
}
