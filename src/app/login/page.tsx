"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";
import { Meteors } from "@/components/landing/meteors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, Sparkles, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("failed with status 0")) {
        setError("Unable to connect to NestJS backend at http://localhost:3000. Please ensure 'pnpm start:dev' is running.");
      } else {
        setError(msg || "Invalid credentials. Please verify email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090a] text-zinc-100 relative overflow-hidden">
      <Navbar />
      <Meteors number={24} />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-[#121318]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Sign In to Workspace</h1>
            <p className="text-xs text-zinc-400">
              Access your project requirements, tasks, decisions, and files
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@example.com"
                  className="pl-10 h-10 text-xs bg-[#1a1b22] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-10 text-xs bg-[#1a1b22] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="glow"
              className="w-full h-10 text-xs font-semibold gap-2 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-medium flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-indigo-400" /> 1-Click Demo Accounts:
              </span>
              <span className="font-mono text-[10px] text-zinc-500">Pass: Password123!</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("alice@example.com")}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300">
                    Alice <span className="text-zinc-500 text-[10px] font-normal">(alice@example.com)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">Project Owner (AI Workspace)</div>
                </div>
                <Badge variant="success" className="text-[10px] py-0 px-1.5">Owner</Badge>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("bob@example.com")}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300">
                    Bob <span className="text-zinc-500 text-[10px] font-normal">(bob@example.com)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">Contributor / Manager</div>
                </div>
                <Badge variant="info" className="text-[10px] py-0 px-1.5">Member</Badge>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("admin@example.com")}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300">
                    System Admin <span className="text-zinc-500 text-[10px] font-normal">(admin@example.com)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">Global System Administrator</div>
                </div>
                <Badge variant="purple" className="text-[10px] py-0 px-1.5">Admin</Badge>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
