"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export const ZoomGallery: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-[#0c0d10] border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono tracking-widest uppercase text-indigo-400">
            System Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            End-to-End Traceability & Knowledge Isolation
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Engineered with strict multi-tenancy, immutable audit trails, and zero external AI leaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-5 rounded-xl border border-white/[0.06] bg-[#121318] hover:border-indigo-500/40 transition-colors space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Versioned Specifications</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every requirement revision is saved with full rollback capabilities and project-local numbering.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-5 rounded-xl border border-white/[0.06] bg-[#121318] hover:border-purple-500/40 transition-colors space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">ADR Supersession</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Architectural decisions prevent cyclic supersession and ensure team decisions remain authoritative.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-5 rounded-xl border border-white/[0.06] bg-[#121318] hover:border-emerald-500/40 transition-colors space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Timezone-Aware Tasks</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Overdue calculations align strictly to the start of the current day in Asia/Bangkok time.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            className="p-5 rounded-xl border border-white/[0.06] bg-[#121318] hover:border-amber-500/40 transition-colors space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Magic-Byte File Storage</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Uploads inspect actual binary signatures (%PDF-, PK) with SHA-256 integrity digests.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
