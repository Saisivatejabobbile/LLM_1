"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Shield, Zap, CheckCircle2 } from "lucide-react";

const PARTICLE_COUNT = 50;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.5 + 0.1,
  }));
}

const badges = [
  { icon: Shield, label: "SOC 2 Compliant", color: "text-emerald-400" },
  { icon: Zap, label: "GPU Accelerated", color: "text-amber-400" },
  { icon: Sparkles, label: "No-Code Required", color: "text-violet-400" },
];

const floatingCards = [
  {
    title: "Training Complete",
    subtitle: "Phi-3 Mini · Legal Corpus",
    value: "96.2%",
    label: "Accuracy",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    accent: "bg-violet-400",
  },
  {
    title: "Model Exported",
    subtitle: "GGUF · 3.8B params",
    value: "2.4GB",
    label: "Model Size",
    color: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    accent: "bg-cyan-400",
  },
  {
    title: "Inference Speed",
    subtitle: "Ollama local · M2 Mac",
    value: "47 tok/s",
    label: "Generation Speed",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    accent: "bg-amber-400",
  },
];

export default function Hero() {
  const particles = generateParticles();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Animated mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#0B1120]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-900/5 rounded-full blur-[150px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-violet-400"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [p.opacity, p.opacity * 1.5, p.opacity],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Announcement badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2 mb-8 text-sm text-violet-300 cursor-pointer hover:border-violet-400/50 transition-colors group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span>Introducing SLM Forge 2.0 — Now with Llama 3.2 support</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-white">Fine-Tune AI</span>
          <br />
          <span className="gradient-text">Without Code</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          Train{" "}
          <span className="text-violet-400 font-semibold">Phi-3, Gemma 2, Llama 3.2, Mistral</span> and more
          on your domain data using LoRA/QLoRA. Export to{" "}
          <span className="text-cyan-400 font-semibold">Ollama-ready GGUF</span> in one click.
        </motion.p>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          {[
            "No GPU required to start",
            "HIPAA compliant data handling",
            "Export in 5 minutes",
          ].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-sm text-slate-500">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
        >
          <Link
            href="/register"
            className="btn-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-3 shadow-xl shadow-violet-500/20"
          >
            <Sparkles size={20} />
            Start Fine-Tuning Free
            <ArrowRight size={18} className="ml-1" />
          </Link>
          <button className="flex items-center gap-2.5 text-slate-300 hover:text-white px-6 py-4 rounded-2xl glass border border-white/[0.08] hover:border-white/20 transition-all duration-300 font-medium text-sm group">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Play size={12} className="text-white ml-0.5" />
            </div>
            Watch 3-min Demo
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-16"
        >
          <div className="flex -space-x-2">
            {["🧑‍⚕️", "⚖️", "🔬", "💼", "🎓"].map((emoji, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-xs"
              >
                {emoji}
              </div>
            ))}
          </div>
          <span>
            <span className="text-white font-semibold">2,400+</span> domain experts already training
          </span>
        </motion.div>

        {/* Floating stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {floatingCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
              className={`glass border ${card.border} rounded-2xl p-5 text-left bg-gradient-to-br ${card.color} card-hover group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-0.5">{card.subtitle}</p>
                  <p className="text-sm font-semibold text-slate-200">{card.title}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${card.accent} animate-pulse`} />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-slate-600">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 border border-slate-700 rounded-full flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 bg-violet-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
