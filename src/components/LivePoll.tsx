"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LivePoll({ active, every = 4000 }: { active: boolean; every?: number }) {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/status").catch(() => null);
    if (!active) return;
    const id = setInterval(() => router.refresh(), every);
    return () => clearInterval(id);
  }, [active, every, router]);
  return null;
}
