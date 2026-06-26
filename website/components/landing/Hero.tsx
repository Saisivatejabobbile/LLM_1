"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, TrendingDown, Clock, Zap } from "lucide-react";

// ── Floating metric card ──────────────────────────────────────────────
function MetricCard({
  title, value, sub, accent, delay, icon: Icon,
}: {
  title: string; value: string; sub: string; accent: string;
  delay: number; icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        padding: "16px 20px",
        backdropFilter: "blur(20px)",
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>{title}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.9 }}>
          <Icon size={13} color="#fff" />
        </div>
      </div>
      <p style={{ fontSize: "1.625rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>{sub}</p>
    </motion.div>
  );
}

const checks = [
  "No GPU setup required",
  "HIPAA & SOC 2 Compliant",
  "Export to Ollama in 1 click",
];

export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "96px 24px 80px",
        overflow: "hidden",
        background: "#080e1a",
      }}
    >
      {/* Background radial blobs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 720, height: 480, background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "30%", left: "15%", width: 340, height: 340, background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "20%", right: "12%", width: 280, height: 280, background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }} />
        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 30%, transparent 100%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, width: "100%", textAlign: "center", margin: "0 auto" }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}
        >
          <div className="section-badge">
            <Sparkles size={12} />
            Now with Llama 3.2 & Qwen2.5 — Fine-tune in minutes
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            color: "#f8fafc",
            marginBottom: 20,
          }}
        >
          Fine-Tune AI Models<br />
          <span className="text-gradient">Without Writing Code</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.6 }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.1875rem)",
            lineHeight: 1.7,
            color: "#64748b",
            maxWidth: 580,
            margin: "0 auto 32px",
          }}
        >
          Upload your domain data, pick a model, and train a custom AI. 
          Export production-ready <strong style={{ color: "#94a3b8" }}>GGUF models</strong> for 
          Ollama in under an hour — no ML expertise needed.
        </motion.p>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 24px", marginBottom: 36 }}
        >
          {checks.map((c) => (
            <span key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: "#64748b" }}>
              <CheckCircle2 size={14} color="#34d399" />
              {c}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 56 }}
        >
          <Link href="/register" className="btn-primary" style={{ padding: "13px 28px", fontSize: "1rem", borderRadius: 12 }}>
            <Zap size={18} />
            Start Fine-Tuning Free
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: "13px 28px", fontSize: "1rem", borderRadius: 12 }}>
            View Live Dashboard
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Social proof line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 56 }}
        >
          <div style={{ display: "flex" }}>
            {["SC", "MR", "PL", "JK", "EV"].map((init, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `hsl(${i * 50 + 250},70%,55%)`,
                border: "2px solid #080e1a",
                marginLeft: i === 0 ? 0 : -8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6875rem", fontWeight: 700, color: "#fff",
              }}>{init}</div>
            ))}
          </div>
          <p style={{ fontSize: "0.875rem", color: "#475569" }}>
            <strong style={{ color: "#94a3b8" }}>2,400+</strong> domain experts training their own AI
          </p>
        </motion.div>

        {/* Metric cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            maxWidth: 700,
            margin: "0 auto",
          }}
          className="metric-grid"
        >
          <MetricCard title="Training Accuracy" value="96.2%" sub="Phi-3 · Legal corpus" accent="rgba(124,58,237,0.8)" delay={0.45} icon={TrendingDown} />
          <MetricCard title="Avg. Training Time" value="34 min" sub="10K examples · 3B model" accent="rgba(8,145,178,0.8)" delay={0.5} icon={Clock} />
          <MetricCard title="Models Exported" value="15,240" sub="GGUF · Total jobs done" accent="rgba(5,150,105,0.8)" delay={0.55} icon={Zap} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
      >
        <span style={{ fontSize: "0.6875rem", color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ width: 20, height: 32, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, display: "flex", justifyContent: "center", paddingTop: 6 }}
        >
          <div style={{ width: 3, height: 6, background: "#7c3aed", borderRadius: 2 }} />
        </motion.div>
      </motion.div>

      <style>{`
        @media (max-width: 600px) {
          .metric-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
