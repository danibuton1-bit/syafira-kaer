import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { admin?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "syafira-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireAdmin() {
  const s = await useSession<AdminSession>(sessionConfig());
  if (!s.data.admin) throw new Error("Tidak diizinkan");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const WEEK = 60 * 60 * 24 * 7;

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [{ data: settings }, { data: media }] = await Promise.all([
    db.from("site_settings").select("*").eq("id", 1).single(),
    db.from("media_items").select("*").order("created_at", { ascending: false }),
  ]);
  const paths = [
    ...(media ?? []).map((m) => m.path).filter(Boolean),
    ...(settings?.music_url ? [settings.music_url] : []),
  ] as string[];
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await db.storage.from("media").createSignedUrls(paths, WEEK);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) signed[d.path] = d.signedUrl;
    });
  }
  return {
    settings: {
      theme: settings?.theme ?? "pink",
      marquee_text: settings?.marquee_text ?? "",
      marquee_speed: settings?.marquee_speed ?? 20,
      marquee_rainbow: settings?.marquee_rainbow ?? true,
      music_title: settings?.music_title ?? null,
      music_src: settings?.music_url ? (signed[settings.music_url] ?? null) : null,
    },
    media: (media ?? []).map((m) => ({
      id: m.id,
      kind: m.kind as "image" | "video",
      caption: m.caption,
      src: (m.path && signed[m.path]) || m.url,
    })),
  };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const s = await useSession<AdminSession>(sessionConfig());
  return { admin: !!s.data.admin };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("ADMIN_PASSWORD belum diatur");
    if (!matches(data.password, expected)) return { ok: false as const };
    const s = await useSession<AdminSession>(sessionConfig());
    await s.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<AdminSession>(sessionConfig());
  await s.clear();
  return { ok: true };
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { theme: string; marquee_text: string; marquee_speed: number; marquee_rainbow: boolean }) => d,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const speed = Math.min(120, Math.max(3, Math.round(Number(data.marquee_speed) || 20)));
    const { error } = await db
      .from("site_settings")
      .update({
        theme: String(data.theme).slice(0, 20),
        marquee_text: String(data.marquee_text).slice(0, 500),
        marquee_speed: speed,
        marquee_rainbow: !!data.marquee_rainbow,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { filename: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const ext = (data.filename.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8);
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { data: up, error } = await db.storage.from("media").createSignedUploadUrl(path);
    if (error || !up) throw new Error(error?.message ?? "Gagal");
    return { path, token: up.token };
  });

export const addMedia = createServerFn({ method: "POST" })
  .inputValidator((d: { kind: "image" | "video"; path: string; caption: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { error } = await db.from("media_items").insert({
      kind: data.kind === "video" ? "video" : "image",
      path: data.path,
      url: data.path,
      caption: data.caption?.slice(0, 200) || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { data: row } = await db.from("media_items").select("path").eq("id", data.id).single();
    if (row?.path) await db.storage.from("media").remove([row.path]);
    await db.from("media_items").delete().eq("id", data.id);
    return { ok: true };
  });

export const setMusic = createServerFn({ method: "POST" })
  .inputValidator((d: { path: string | null; title: string | null }) => d)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await admin();
    const { error } = await db
      .from("site_settings")
      .update({ music_url: data.path, music_title: data.title?.slice(0, 120) ?? null })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
