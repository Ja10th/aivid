"use client";
import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { animate, stagger, type AnimationParams } from "animejs";

export function Reveal({ children, className, style, delay = 0, from = "up", as: Tag = "div" }: { children: ReactNode; className?: string; style?: CSSProperties; delay?: number; from?: "up" | "left" | "right" | "scale" | "skew"; as?: "div" | "section" | "header" | "li" | "span" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const base: AnimationParams = { opacity: [0, 1], duration: 1100, delay, ease: "outExpo" };
    if (from === "up") base.translateY = [46, 0];
    if (from === "left") base.translateX = [-70, 0];
    if (from === "right") base.translateX = [70, 0];
    if (from === "scale") base.scale = [0.82, 1];
    if (from === "skew") { base.skewX = [-12, 0]; base.translateX = [-40, 0]; }
    animate(ref.current, base);
  }, [delay, from]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T ref={ref} className={className} style={{ opacity: 0, ...style }}>{children}</T>;
}

export function StaggerList({ children, className, selector = ":scope > *", delay = 0 }: { children: ReactNode; className?: string; selector?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll(selector);
    if (!items.length) return;
    animate(items, { opacity: [0, 1], translateY: [30, 0], rotate: [() => (Math.random() - 0.5) * 6, 0], delay: stagger(70, { start: delay }), duration: 900, ease: "outQuint" });
  }, [selector, delay, children]);
  return <div ref={ref} className={className}>{children}</div>;
}

export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const obj = { v: 0 };
    animate(obj, { v: value, duration: 1400, ease: "outExpo", onUpdate: () => { if (ref.current) ref.current.textContent = String(Math.round(obj.v)); } });
  }, [value]);
  return <span ref={ref} className={className}>0</span>;
}

export function Marquee({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const inner = ref.current.firstElementChild as HTMLElement;
    const w = inner.offsetWidth / 2;
    const a = animate(inner, { translateX: [0, -w], duration: Math.max(8000, w * 12), ease: "linear", loop: true });
    return () => { a.pause(); };
  }, [text]);
  return (
    <div ref={ref} className={`marquee ${className ?? ""}`}>
      <div style={{ display: "inline-block", whiteSpace: "nowrap" }}>
        <span>{text}</span><span>{text}</span>
      </div>
    </div>
  );
}

export function Pulse({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const a = animate(ref.current, { scale: [1, 1.18, 1], rotate: [0, -3, 0], duration: 1600, loop: true, ease: "inOutSine" });
    return () => { a.pause(); };
  }, []);
  return <span ref={ref} className={className} style={{ display: "inline-block" }}>{children}</span>;
}
