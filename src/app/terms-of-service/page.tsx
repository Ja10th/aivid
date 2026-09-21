import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Loop Foundry",
  description: "The terms that apply when you use Loop Foundry.",
};

export default function TermsOfService() {
  return (
    <main className="page">
      <div className="edge-label">terms · loop foundry</div>
      <div className="ghost-num" style={{ right: "4%", top: "10rem" }}>T</div>

      <header className="col-span-12 md:col-start-6 md:col-span-7 mt-4 relative z-10">
        <div className="t-vt text-oxblood">the rules of the machine</div>
        <h1 className="h-display text-[15vw] md:text-[7vw] mt-2">Terms of<br /><span className="text-magenta">Service</span></h1>
        <p className="t-serif t-italic text-2xl md:text-3xl mt-6 max-w-2xl leading-tight">
          Use the factory creatively, responsibly, and only with the rights and permissions needed for what you ask it to publish.
        </p>
        <div className="t-vt text-oxblood mt-6">Last updated: September 21, 2026</div>
      </header>

      <article className="col-span-12 md:col-start-2 md:col-span-8 mt-16 md:mt-24 relative z-10 max-w-3xl">
        <section className="block-hot p-6 md:p-10 tilt-l mb-12">
          <div className="t-vt mb-3">01 / the short version</div>
          <p className="text-2xl md:text-3xl leading-tight">By using Loop Foundry, you agree to these terms. You are responsible for your account, your inputs, your generated media, and anything the service publishes to connected channels.</p>
        </section>

        <div className="space-y-12">
          <section>
            <h2 className="h-bungee text-3xl mb-3">Using the service</h2>
            <p>You may use Loop Foundry only if you can legally agree to these terms. Keep your account details accurate, protect your credentials, and tell us promptly if you believe your account or a connected channel has been used without permission.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Your content and permissions</h2>
            <p>You retain ownership of the prompts, media, channel content, and other material you provide, subject to the rights of others. You give Loop Foundry the limited permission needed to host, transform, render, transmit, and publish that material as you direct. You represent that you have the rights, licenses, and consents required for your inputs, music, voices, images, trademarks, and publishing instructions.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Automated publishing</h2>
            <p>Automations may generate or publish content without a separate manual review, depending on your settings. Review your prompts, schedules, connected channels, and privacy settings before enabling an automation. Loop Foundry cannot guarantee that generated content is accurate, original, suitable for every audience, or accepted by YouTube or another platform.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Acceptable use</h2>
            <p>You may not use the service to violate law or another person&apos;s rights; infringe copyright, privacy, publicity, or trademark rights; impersonate people or organizations; create fraud, spam, harassment, malware, or deceptive content; evade platform rules; or interfere with the service. You are responsible for complying with YouTube&apos;s terms, API policies, community guidelines, and all laws that apply to your content and audience.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Third-party services</h2>
            <p>Loop Foundry can connect to services such as YouTube, storage providers, media processors, and text-to-speech providers. Their terms and policies apply to your use of those services. Third-party availability, quotas, moderation decisions, and API changes are outside Loop Foundry&apos;s control.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Availability and changes</h2>
            <p>The service is provided as it is and may change, pause, or become unavailable for maintenance, provider outages, safety reasons, or other operational needs. We may update these terms as the service evolves. If a change is material, we will provide notice where reasonably practical. Continued use after an update means you accept the revised terms.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Disclaimers and liability</h2>
            <p>To the maximum extent permitted by law, Loop Foundry is not responsible for indirect, incidental, special, consequential, or punitive losses, lost revenue, lost data, channel suspension, or content decisions made by third-party platforms. The service is not a substitute for legal, financial, medical, or professional advice. Nothing in these terms limits liability that cannot legally be limited.</p>
          </section>

          <section>
            <h2 className="h-bungee text-3xl mb-3">Suspension and termination</h2>
            <p>You may stop using the service at any time. The deployment operator may suspend or terminate access when necessary to protect the service, comply with law, address abuse, or enforce these terms. Provisions concerning ownership, acceptable use, disclaimers, liability, and dispute handling survive termination where applicable.</p>
          </section>

          <section className="border-t-2 border-ink pt-8">
            <h2 className="h-bungee text-3xl mb-3">Contact</h2>
            <p>Questions about these terms should go to the person or organization operating your Loop Foundry instance using the support details provided with that deployment.</p>
          </section>
        </div>
      </article>

      <footer className="col-span-12 mt-20 t-vt opacity-70 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/privacy-policy" className="underline-hot">privacy policy →</Link>
        <Link href="/" className="underline-hot">back to the desk →</Link>
      </footer>
    </main>
  );
}
