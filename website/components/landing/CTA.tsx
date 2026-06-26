"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative glass border border-violet-500/20 rounded-3xl p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Animated background blobs */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-violet-600/15 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-violet-900/10 rounded-full blur-[60px]" />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] rounded-3xl"
            style={{
              backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mb-6 shadow-2xl shadow-violet-500/30 mx-auto"
            >
              <Sparkles size={28} className="text-white" />
            </motion.div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Your domain.
              <br />
              <span className="gradient-text">Your AI.</span>
            </h2>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join 2,400+ doctors, lawyers, engineers, and researchers already using SLM Forge to build
              AI that actually understands their domain. No ML degree required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="btn-primary text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-violet-500/30"
              >
                <Zap size={20} />
                Start Training Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white px-8 py-4 rounded-2xl glass border border-white/10 hover:border-white/20 font-medium transition-all duration-300"
              >
                Sign In →
              </Link>
            </div>

            <p className="text-sm text-slate-600 mt-6">
              Free forever · No credit card · 3 free fine-tuning jobs
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
