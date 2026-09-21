import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Loop Foundry",
  description: "How Loop Foundry collects, uses, stores, and protects information.",
};

export default function PrivacyPolicy() {
  return (
    <main className="page">
      <div className="edge-label">privacy · loop foundry</div>
      <div className="ghost-num" style={{ left: "-2rem", top: "8rem" }}>P</div>

      <header className="col-span-12 md:col-start-2 md:col-span-7 mt-4 relative z-10">
        <div className="t-vt text-oxblood">the small print</div>
        <h1 className="h-display text-[15vw] md:text-[7vw] mt-2">Privacy<br /><span className="text-cobalt">Policy</span></h1>
        <p className="t-serif t-italic text-2xl md:text-3xl mt-6 max-w-2xl leading-tight">
          Your channels are yours. This page explains what Loop Foundry needs to run the factory and how that information is handled.
        </p>
        <div className="t-vt text-oxblood mt-6">Last updated: September 21, 2026</div>
      </header>

      <article className="col-span-12 md:col-start-3 md:col-span-8 mt-16 md:mt-24 relative z-10 max-w-3xl">
        <section className="block-ink p-6 md:p-10 tilt-r mb-12">
          <div className="t-vt text-acid mb-3">01 / the short version</div>
          <p className="text-2xl md:text-3xl leading-tight">
            Loop Foundry uses information you provide to generate, render, schedule, and publish videos. We do not sell personal information. You can disconnect a channel or delete your data through the deployment operator.
          </p>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="h-bungee text-3xl mb-3">What we collect</h2>
            <p>Depending on how your deployment is configured, we may collect your name or email address, account and workspace details, connected YouTube channel details, video prompts and settings, generated media, publishing preferences, and technical logs such as timestamps, browser information, and error details.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Connected accounts</h2>
            <p>When you connect YouTube, Loop Foundry uses OAuth credentials to act on your behalf—for example, to upload videos, read channel information, and manage scheduled publishing. We do not receive your Google password. Refresh tokens and other credentials should be treated as confidential and are stored only for as long as the connection is active or as needed to keep the service working.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">How we use information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide the studio, rendering, scheduling, and publishing features.</li>
              <li>To save your settings and show the status of jobs and automations.</li>
              <li>To troubleshoot errors, protect the service, and improve reliability.</li>
              <li>To communicate about your account or material service changes.</li>
            </ul>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Service providers</h2>
            <p>Loop Foundry may use infrastructure and processing providers for hosting, databases, object storage, media delivery, text-to-speech, video rendering, and YouTube API access. Those providers receive only the information needed to perform their services and may process it in countries different from yours.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Retention and deletion</h2>
            <p>We keep information while your workspace or connected services are active, and for a reasonable period afterward when needed for security, accounting, dispute resolution, or legal obligations. Generated videos and media may remain until you or the deployment operator deletes them. To request access, correction, export, or deletion, contact the operator or support address for your Loop Foundry deployment.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Cookies and security</h2>
            <p>The application may use essential cookies or similar storage to keep you signed in and protect requests. We use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security. Never share OAuth tokens or credentials in prompts, support messages, or public content.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Your choices</h2>
            <p>You can stop an automation, disconnect a channel, remove content, or ask for a copy or deletion of personal information, subject to records we must keep by law. You may also object to or limit certain processing where applicable under local law.</p>
          </section>

          <section className="border-t-2 border-ink pt-8">
            <h2 className="h-bungee text-3xl mb-3">Questions</h2>
            <p>For privacy questions or requests, contact the person or organization operating your Loop Foundry instance using the support details provided with that deployment.</p>
          </section>
        </div>
      </article>

      <footer className="col-span-12 mt-20 t-vt opacity-70 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/terms-of-service" className="underline-hot">terms of service →</Link>
        <Link href="/" className="underline-hot">back to the desk →</Link>
      </footer>
    </main>
  );
}
