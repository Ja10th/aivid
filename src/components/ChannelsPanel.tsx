"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal, StaggerList } from "./Anim";

interface Ch { id: number; title: string; handle: string | null; thumbnailUrl: string | null; subscriberCount: number; posted: number; hasRefresh: boolean }

export default function ChannelsPanel({ channels, flash }: { channels: Ch[]; flash: { error?: string; connected?: string } }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<{ configured: boolean; clientId: string | null; redirectUri: string; fromEnv: boolean } | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [msg, setMsg] = useState<string | null>(flash.error ? `error: ${flash.error}` : flash.connected ? `connected ${flash.connected}` : null);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then(setCfg); }, []);
  const save = async () => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }) });
    setClientId(""); setClientSecret(""); setMsg("saved credentials");
    fetch("/api/settings").then((r) => r.json()).then(setCfg);
  };
  const remove = async (id: number) => { if (!confirm("Disconnect this channel?")) return; await fetch(`/api/channels/${id}`, { method: "DELETE" }); router.refresh(); };

  return (
    <>
      <Reveal delay={150} from="left" className="col-span-12 md:col-start-1 md:col-span-6 mt-10 md:-mt-6 z-10">
        {msg && <div className={`p-3 t-vt mb-6 inline-block ${msg.startsWith("error") ? "block-ox" : "block-acid"}`}>{msg}</div>}
        <div className="block-ink p-6 tilt-r">
          <div className="h-bungee text-2xl text-acid mb-2">Google OAuth</div>
          {cfg?.configured ? (
            <div className="t-vt">configured {cfg.fromEnv ? "via environment" : "in settings"} · client {cfg.clientId}</div>
          ) : (
            <p className="t-serif text-lg">Create an OAuth client (type: <b>Web application</b>) in Google Cloud Console with the YouTube Data API v3 enabled, add the redirect URI below, then paste the credentials here. Or set <code className="t-vt">GOOGLE_CLIENT_ID</code> / <code className="t-vt">GOOGLE_CLIENT_SECRET</code> as environment variables.</p>
          )}
          <label className="lbl text-acid mt-4">authorized redirect uri</label>
          <div className="t-vt text-magenta break-all select-all">{cfg?.redirectUri ?? "…"}</div>
          {!cfg?.fromEnv && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              <div><label className="lbl text-acid">client id</label><input value={clientId} onChange={(e) => setClientId(e.target.value)} className="field text-bone border-bone" placeholder="xxxx.apps.googleusercontent.com" /></div>
              <div><label className="lbl text-acid">client secret</label><input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} type="password" className="field text-bone border-bone" /></div>
              <button onClick={save} disabled={!clientId || !clientSecret} className="btn btn-ghost text-bone border-bone w-fit">Save credentials</button>
            </div>
          )}
          <div className="dash border-bone my-5" />
          <a href="/api/youtube/connect" className={`btn btn-hot text-xl ${cfg && !cfg.configured ? "pointer-events-none opacity-40" : ""}`}>+ Connect a YouTube channel</a>
          <div className="t-vt opacity-60 mt-2">you can repeat this for every channel / brand account</div>
        </div>
      </Reveal>

      <section className="col-span-12 md:col-start-7 md:col-span-6 mt-20 z-10">
        <div className="h-display text-3xl mb-6 ml-24">Connected</div>
        {!channels.length && <div className="t-serif t-italic text-2xl ml-24">Nothing connected.</div>}
        <StaggerList className="flex flex-col gap-5">
          {channels.map((c, i) => (
            <div key={c.id} className={`flex gap-4 items-center p-4 border-[3px] border-ink bg-bone ${i % 2 ? "tilt-l ml-24" : "tilt-r ml-6"}`} style={{ boxShadow: "8px 8px 0 var(--cobalt)" }}>
              {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" className="w-16 h-16 rounded-full border-2 border-ink" /> : <div className="w-16 h-16 rounded-full block-hot" />}
              <div className="flex-1">
                <div className="h-bungee text-xl">{c.title}</div>
                <div className="t-vt text-oxblood">{c.handle ?? ""} · {c.subscriberCount} subs · {c.posted} posted from here{!c.hasRefresh ? " · ⚠ no refresh token, reconnect" : ""}</div>
              </div>
              <button onClick={() => remove(c.id)} className="chip text-oxblood">disconnect</button>
            </div>
          ))}
        </StaggerList>
      </section>
    </>
  );
}
