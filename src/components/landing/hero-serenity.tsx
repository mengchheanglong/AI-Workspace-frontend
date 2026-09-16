"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Meteors } from "./meteors";
import { TextReveal } from "./text-reveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Layers, ChevronRight, Terminal } from "lucide-react";

export const HeroSerenity: React.FC = () => {
  return (
    <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden bg-[#08090a]">
      <Meteors number={28} />

      {/* Radial Gradient Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Capsule Pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs font-medium mb-8 backdrop-blur-md hover:border-white/20 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-zinc-300">Phase 1 Workspace Live • Bangkok Timezone Sync</span>
        <ChevronRight className="w-3 h-3 text-zinc-500" />
      </motion.div>

      {/* Main Headline with Linear tight tracking */}
      <div className="max-w-4xl mx-auto space-y-5">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] text-white leading-[1.12]">
          Unified Intelligence for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Modern Project Teams
          </span>
        </h1>

        <div className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 pt-1 leading-relaxed">
          <TextReveal
            text="Manage requirements, architectural decisions, tasks, meetings, and project documents in a high-integrity workspace with strict permission boundaries."
            delay={0.15}
          />
        </div>
      </div>

      {/* Action Buttons with Emil's micro-interactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex flex-wrap items-center justify-center gap-3.5 mt-8"
      >
        <Link href="/dashboard">
          <Button variant="glow" size="lg" className="gap-2 text-xs font-semibold px-6 h-11">
            Open Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg" className="text-xs font-semibold px-6 h-11">
            Demo Accounts Sign In
          </Button>
        </Link>
      </motion.div>

      {/* Live Workspace Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-4xl mx-auto mt-14 rounded-xl border border-white/[0.08] bg-[#111216]/90 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <div className="rounded-lg border border-white/[0.04] bg-[#0c0d10] p-4 text-left">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-zinc-500 ml-2">workspace.internal:3000</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <Terminal className="w-3 h-3" /> API v1 Connected
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="text-[11px] font-mono text-indigo-400">AIW-REQ-1</div>
              <div className="text-xs font-semibold text-zinc-200 mt-1">Biometric Authentication</div>
              <div className="text-[10px] text-zinc-500 mt-1">Status: APPROVED • Rev 2</div>
            </div>
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="text-[11px] font-mono text-purple-400">AIW-DEC-1</div>
              <div className="text-xs font-semibold text-zinc-200 mt-1">PostgreSQL & pgvector</div>
              <div className="text-[10px] text-zinc-500 mt-1">Status: ACCEPTED • 0 Cycles</div>
            </div>
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="text-[11px] font-mono text-emerald-400">AIW-TSK-1</div>
              <div className="text-xs font-semibold text-zinc-200 mt-1">Setup DB Migrations</div>
              <div className="text-[10px] text-zinc-500 mt-1">Progress: 100% DONE</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
