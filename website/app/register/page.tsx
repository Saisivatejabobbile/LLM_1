"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Zap, ArrowRight, GitBranch, Globe, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", domain: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    window.location.href = "/dashboard";
  };

  const domains = [
    "Healthcare / Medicine",
    "Legal / Law",
    "Engineering",
    "Finance",
    "Education",
    "Customer Support",
    "Research",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">SLM Forge</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm">Start fine-tuning AI for free — no credit card</p>
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 glass border border-white/[0.08] hover:border-white/20 rounded-xl py-3 text-sm text-slate-300 hover:text-white transition-all duration-200">
              <GitBranch size={17} />
              GitHub
            </button>
            <button className="flex items-center justify-center gap-2 glass border border-white/[0.08] hover:border-white/20 rounded-xl py-3 text-sm text-slate-300 hover:text-white transition-all duration-200">
              <Globe size={17} />
              Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-slate-600">or sign up with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Dr. Sarah Chen"
                className="w-full glass border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none transition-colors duration-200 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="reg-email">
                Work email
              </label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@company.com"
                className="w-full glass border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm outline-none transition-colors duration-200 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="domain">
                Your domain
              </label>
              <select
                id="domain"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                required
                className="w-full glass border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors duration-200 bg-[#0B1120] appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-slate-600">Select your domain...</option>
                {domains.map((d) => (
                  <option key={d} value={d} className="bg-[#1a1f2e] text-white">{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full glass border border-white/[0.08] focus:border-violet-500/50 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-slate-600 text-sm outline-none transition-colors duration-200 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Perks */}
            <div className="glass border border-emerald-500/20 rounded-xl p-3 bg-emerald-500/5">
              {["3 free fine-tuning jobs", "Export to GGUF/Ollama", "No credit card required"].map(
                (perk) => (
                  <div key={perk} className="flex items-center gap-2 text-xs text-emerald-400 py-1">
                    <CheckCircle2 size={13} />
                    {perk}
                  </div>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-600 mt-2">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-slate-500 hover:text-slate-400">Terms</a>{" "}
              and{" "}
              <a href="#" className="text-slate-500 hover:text-slate-400">Privacy Policy</a>
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
