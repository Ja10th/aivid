import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Loop Foundry — autonomous YouTube video factory",
  description: "Generates, renders, schedules and posts unique videos to your YouTube channels every day.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        {children}
        <div className="fixed left-2 top-2 t-vt text-[11px] opacity-50 rotate-[-90deg] origin-top-left translate-y-24 pointer-events-none">every video is different</div>
      </body>
    </html>
  );
}
