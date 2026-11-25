import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteQuery } from "@/lib/site-query";
import { BrandTitle } from "@/components/site/BrandTitle";
import logo from "@/assets/syafira-logo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syafira Kaer — Dunia Kecil Penuh Cinta" },
      { name: "description", content: "Foto, video, dan lagu kenangan untuk Syafira Kaer." },
      { property: "og:title", content: "Syafira Kaer — Dunia Kecil Penuh Cinta" },
      { property: "og:description", content: "Foto, video, dan lagu kenangan untuk Syafira Kaer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(siteQuery);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24">
      <header className="flex items-center justify-between py-4">
        <BrandTitle />
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary">Admin</Link>
      </header>

      <section className="fade-up flex flex-col items-center py-14 text-center">
        <BrandTitle size="lg" />
        <p className="mt-6 max-w-md font-display text-lg italic text-muted-foreground">
          Untuk seseorang yang membuat setiap hari terasa lebih indah ♥
        </p>
      </section>

      <section className="shine-box mx-auto mb-16 max-w-3xl overflow-hidden rounded-3xl border border-border shadow-2xl">
        <img src={logo.url} alt="Syafira Kaer" className="w-full object-cover" />
      </section>

      <h2 className="mb-6 text-center font-display text-3xl text-primary">Galeri Kenangan</h2>
      {data.media.length === 0 ? (
        <p className="text-center text-muted-foreground">Belum ada foto atau video. Admin bisa menambahkannya di panel admin.</p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {data.media.map((m) => (
            <figure key={m.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              {m.kind === "video" ? (
                <video src={m.src} controls playsInline className="w-full" />
              ) : (
                <img src={m.src} alt={m.caption ?? "Foto"} loading="lazy" className="w-full" />
              )}
              {m.caption && <figcaption className="p-3 text-sm text-card-foreground">{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
