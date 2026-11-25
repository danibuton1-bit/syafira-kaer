export function Marquee({ text, speed, rainbow }: { text: string; speed: number; rainbow: boolean }) {
  if (!text) return null;
  const item = (
    <span className={`px-8 text-sm font-bold tracking-wide ${rainbow ? "rainbow-text" : "text-primary"}`}>
      {text}
    </span>
  );
  return (
    <div className="sticky top-0 z-40 overflow-hidden border-b border-border bg-card/90 py-2 backdrop-blur">
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {item}{item}{item}{item}
      </div>
    </div>
  );
}
