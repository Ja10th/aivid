"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const LINKS = [
  ["/", "Desk"],
  ["/studio", "Studio"],
  ["/videos", "Library"],
  ["/automations", "Automations"],
  ["/channels", "Channels"],
  ["/music", "Music"],
];

export default function Nav() {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current.querySelectorAll("a"), { translateX: [80, 0], opacity: [0, 1], delay: stagger(60, { start: 200 }), duration: 900, ease: "outExpo" });
  }, []);
  return (
    <>
      <nav ref={ref} className="fixed right-0 top-0 z-40 flex flex-col items-end gap-0 pt-3">
        {LINKS.map(([href, label], i) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`t-vt px-3 py-1 border-l-4 transition-all hover:bg-acid hover:text-ink hover:pr-8 ${on ? "bg-ink text-acid border-magenta pr-6" : "bg-bone/80 text-ink border-ink"}`} style={{ marginRight: on ? 0 : i % 2 ? 6 : 0, opacity: 0 }}>
              <span className="opacity-50 mr-2">0{i + 1}</span>{label}
            </Link>
          );
        })}
      </nav>
      <Link href="/" className="fixed left-3 bottom-3 z-40 h-bungee text-[13px] leading-none bg-magenta text-ink px-2 py-1 rotate-[-4deg] hover:rotate-[4deg] transition-transform">
        LOOP<br />FOUNDRY
      </Link>
      <div className="fixed right-3 bottom-3 z-40 flex gap-3 t-vt text-sm">
        <Link href="/privacy-policy" className="bg-bone/80 px-1 underline-hot">privacy</Link>
        <Link href="/terms-of-service" className="bg-bone/80 px-1 underline-hot">terms</Link>
      </div>
    </>
  );
}
