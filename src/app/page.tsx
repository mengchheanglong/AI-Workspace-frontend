import { Navbar } from "@/components/navbar";
import { HeroSerenity } from "@/components/landing/hero-serenity";
import { ZoomGallery } from "@/components/landing/zoom-gallery";
import { ParallaxTeam } from "@/components/landing/parallax-team";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#08090a] text-zinc-200">
      <Navbar />
      <main className="flex-1">
        <HeroSerenity />
        <ZoomGallery />
        <ParallaxTeam />
      </main>
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-zinc-500">
        AI Project Workspace • NestJS Backend • Next.js Frontend • Phase 1 Quality Gate Passed
      </footer>
    </div>
  );
}
