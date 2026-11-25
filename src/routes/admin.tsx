import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteQuery, THEMES } from "@/lib/site-query";
import {
  adminLogin, adminLogout, adminStatus, updateSettings, createUploadUrl, addMedia, deleteMedia, setMusic,
} from "@/lib/site.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BrandTitle } from "@/components/site/BrandTitle";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel Admin — Syafira Kaer" },
      { name: "description", content: "Atur tampilan, musik, dan galeri Syafira Kaer." },
      { property: "og:title", content: "Panel Admin — Syafira Kaer" },
      { property: "og:description", content: "Atur tampilan, musik, dan galeri Syafira Kaer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => adminStatus(),
  component: AdminPage,
});

function AdminPage() {
  const { admin } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <BrandTitle />
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Beranda</Link>
      </div>
      {admin ? <Dashboard /> : <Login />}
    </main>
  );
}

function Login() {
  const router = useRouter();
  const login = useServerFn(adminLogin);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await login({ data: { password: pw } });
        setBusy(false);
        if (r.ok) router.invalidate();
        else setErr(true);
      }}
    >
      <h1 className="font-display text-2xl text-primary">Masuk Admin</h1>
      <Label htmlFor="pw">Password</Label>
      <div className="relative">
        <Input id="pw" type={show ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} className="pr-10" autoComplete="current-password" />
        <button type="button" aria-label={show ? "Sembunyikan password" : "Lihat password"} onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {err && <p className="text-sm text-destructive">Password salah</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Memeriksa..." : "Masuk"}</Button>
    </form>
  );
}

async function uploadFile(getUrl: (a: { data: { filename: string } }) => Promise<{ path: string; token: string }>, file: File) {
  const { path, token } = await getUrl({ data: { filename: file.name } });
  const { error } = await supabase.storage.from("media").uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

function Dashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteQuery);
  const s = data.settings;
  const save = useServerFn(updateSettings);
  const getUrl = useServerFn(createUploadUrl);
  const add = useServerFn(addMedia);
  const del = useServerFn(deleteMedia);
  const music = useServerFn(setMusic);
  const logout = useServerFn(adminLogout);

  const [theme, setTheme] = useState(s.theme);
  const [text, setText] = useState(s.marquee_text);
  const [speed, setSpeed] = useState(s.marquee_speed);
  const [rainbow, setRainbow] = useState(s.marquee_rainbow);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["site"] });

  async function saveSettings(next?: Partial<{ theme: string }>) {
    await save({ data: { theme: next?.theme ?? theme, marquee_text: text, marquee_speed: speed, marquee_rainbow: rainbow } });
    await refresh();
    toast.success("Tersimpan 💖");
  }

  return (
    <div className="space-y-6">
      <Card title="Warna Desain">
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button key={t.id} type="button" data-theme={t.id}
              onClick={() => { setTheme(t.id); saveSettings({ theme: t.id }); }}
              className={`rounded-2xl border-2 bg-background p-3 text-sm font-semibold text-foreground ${theme === t.id ? "border-primary ring-2 ring-ring" : "border-border"}`}>
              <span className="mx-auto mb-2 block h-6 w-6 rounded-full bg-primary" />
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Teks Berjalan">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        <Label>Kecepatan: {speed} detik per putaran (makin kecil makin cepat)</Label>
        <Slider min={3} max={120} step={1} value={[speed]} onValueChange={(v) => setSpeed(v[0] ?? 20)} />
        <div className="flex items-center gap-3">
          <Switch checked={rainbow} onCheckedChange={setRainbow} id="rb" />
          <Label htmlFor="rb">Warna-warni (mati = pink)</Label>
        </div>
        <Button onClick={() => saveSettings()}>Simpan Teks</Button>
      </Card>

      <Card title="Musik Halaman Utama">
        <p className="text-sm text-muted-foreground">{s.music_title ? `Sekarang: ${s.music_title}` : "Belum ada musik."}</p>
        {s.music_src && <audio src={s.music_src} controls className="w-full" />}
        <FilePick accept="audio/*" label={busy === "music" ? "Mengunggah..." : "Unggah Lagu"} disabled={!!busy}
          onFile={async (f) => {
            try { setBusy("music"); const path = await uploadFile(getUrl, f); await music({ data: { path, title: f.name.replace(/\.[^.]+$/, "") } }); await refresh(); toast.success("Musik diganti 🎵"); }
            catch (e) { toast.error(String((e as Error).message)); } finally { setBusy(""); }
          }} />
        {s.music_src && <Button variant="outline" onClick={async () => { await music({ data: { path: null, title: null } }); await refresh(); }}>Hapus Musik</Button>}
      </Card>

      <Card title="Foto & Video">
        <Input placeholder="Keterangan (opsional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <FilePick accept="image/*,video/*" label={busy === "media" ? "Mengunggah..." : "Unggah Foto / Video"} disabled={!!busy}
          onFile={async (f) => {
            try { setBusy("media"); const path = await uploadFile(getUrl, f); await add({ data: { kind: f.type.startsWith("video") ? "video" : "image", path, caption } }); setCaption(""); await refresh(); toast.success("Ditambahkan ✨"); }
            catch (e) { toast.error(String((e as Error).message)); } finally { setBusy(""); }
          }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.media.map((m) => (
            <div key={m.id} className="relative overflow-hidden rounded-xl border border-border">
              {m.kind === "video" ? <video src={m.src} className="aspect-square w-full object-cover" muted /> : <img src={m.src} alt={m.caption ?? ""} className="aspect-square w-full object-cover" />}
              <button type="button" aria-label="Hapus" onClick={async () => { if (!confirm("Hapus item ini?")) return; await del({ data: { id: m.id } }); await refresh(); }}
                className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="outline" onClick={async () => { await logout(); router.invalidate(); }}>Keluar</Button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-md">
      <h2 className="font-display text-xl text-primary">{title}</h2>
      {children}
    </section>
  );
}

function FilePick({ accept, label, onFile, disabled }: { accept: string; label: string; onFile: (f: File) => void; disabled?: boolean }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <Upload className="h-4 w-4" /> {label}
      <input type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
    </label>
  );
}
