"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Upload,
  Cpu,
  BarChart3,
  Rocket,
  Database,
  Sliders,
  Zap,
  Globe,
  Lock,
  RefreshCw,
  Brain,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Smart Dataset Ingestion",
    description:
      "Upload CSV, JSONL, PDF, or plain text. Our AI auto-detects schema and converts it to the perfect instruction format for fine-tuning.",
    color: "from-violet-500 to-violet-700",
    glow: "group-hover:shadow-violet-500/20",
    badge: "AI-Powered",
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Sliders,
    title: "Visual Hyperparameter Tuning",
    description:
      "Adjust LoRA rank, alpha, learning rate, and quantization via intuitive sliders — no terminal needed. Smart defaults for every model.",
    color: "from-cyan-500 to-cyan-700",
    glow: "group-hover:shadow-cyan-500/20",
    badge: "No-Code",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: BarChart3,
    title: "Real-Time Training Metrics",
    description:
      "Watch loss curves, accuracy, and GPU utilization update live via WebSocket. Compare multiple training runs side by side.",
    color: "from-emerald-500 to-emerald-700",
    glow: "group-hover:shadow-emerald-500/20",
    badge: "Live",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Brain,
    title: "5 Best-in-Class Models",
    description:
      "Choose from Phi-3 Mini, Gemma 2 2B, Llama 3.2 3B, Mistral 7B, or Qwen2.5 3B — all optimized for domain-specific fine-tuning.",
    color: "from-amber-500 to-amber-700",
    glow: "group-hover:shadow-amber-500/20",
    badge: "State-of-Art",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Rocket,
    title: "One-Click GGUF Export",
    description:
      "Merge LoRA adapters, quantize, and export to GGUF format with one click. Immediately register the model in your local Ollama instance.",
    color: "from-pink-500 to-pink-700",
    glow: "group-hover:shadow-pink-500/20",
    badge: "Instant",
    badgeColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
  {
    icon: Globe,
    title: "A/B Evaluation Suite",
    description:
      "Compare your fine-tuned model against the base with BLEU, ROUGE, and custom prompts. Generate a shareable evaluation report.",
    color: "from-indigo-500 to-indigo-700",
    glow: "group-hover:shadow-indigo-500/20",
    badge: "Enterprise",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description:
      "Your training data never leaves your infrastructure. Deploy on-premise or in your private cloud. HIPAA and SOC 2 compliant.",
    color: "from-rose-500 to-rose-700",
    glow: "group-hover:shadow-rose-500/20",
    badge: "HIPAA",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Code2,
    title: "API & Webhook Integration",
    description:
      "Trigger training runs via REST API. Receive webhook updates on job completion. Integrate with your existing ML workflows.",
    color: "from-teal-500 to-teal-700",
    glow: "group-hover:shadow-teal-500/20",
    badge: "Developer",
    badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2 mb-6 text-sm text-violet-300">
            <Cpu size={14} />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Everything you need to
            <br />
            <span className="gradient-text">ship a custom AI</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From raw data to a production-ready fine-tuned model — without writing a single line of code
            or understanding gradient descent.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`glass border border-white/[0.06] rounded-2xl p-6 card-hover group relative overflow-hidden ${
                i === 0 || i === 4 ? "md:col-span-2" : ""
              }`}
            >
              {/* Hover glow */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${feature.glow}`}
                style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.2)" }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon size={22} className="text-white" />
                </div>

                {/* Badge */}
                <span
                  className={`inline-flex text-xs font-medium px-2 py-1 rounded-md border mb-3 ${feature.badgeColor}`}
                >
                  {feature.badge}
                </span>

                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
