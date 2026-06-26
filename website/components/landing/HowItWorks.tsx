"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Settings2, TrendingUp, Download, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Data",
    description:
      "Drag and drop your domain-specific dataset — clinical notes, legal briefs, engineering manuals, customer support logs. Supports CSV, JSONL, PDF, TXT.",
    detail: "Auto-parsed & formatted to instruction-response pairs",
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    items: ["PDF extraction", "CSV → JSONL conversion", "Quality validation", "Deduplication"],
  },
  {
    number: "02",
    icon: Settings2,
    title: "Configure Your Training",
    description:
      "Select your base model, choose LoRA or QLoRA, and tweak parameters with visual sliders. Smart presets for medical, legal, technical, and creative domains.",
    detail: "Intelligent defaults based on dataset size",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    items: ["Model selection", "LoRA rank & alpha", "Learning rate", "Quantization (4-bit/8-bit)"],
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Train & Monitor Live",
    description:
      "Submit your job to our GPU cluster or your local hardware. Watch live loss curves, perplexity, and validation metrics update in real time via WebSocket.",
    detail: "Average training time: 15-45 minutes",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    items: ["Live loss curves", "GPU utilization", "ETA countdown", "Auto checkpoint saving"],
  },
  {
    number: "04",
    icon: Download,
    title: "Export & Deploy",
    description:
      "Merge adapters, quantize with llama.cpp, export as GGUF, and register directly in Ollama. Share with your team or deploy as a REST API endpoint.",
    detail: "Model ready in under 2 minutes after training",
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    items: ["GGUF conversion", "Ollama registration", "API endpoint", "Shareable link"],
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-violet-900/5 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 glass border border-cyan-500/30 rounded-full px-4 py-2 mb-6 text-sm text-cyan-300">
            <CheckCircle size={14} />
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            From data to deployed AI
            <br />
            <span className="gradient-text-cyan">in under an hour</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No PhD required. No cloud setup. No infrastructure headaches.
            Just your data and a browser.
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center`}
            >
              {/* Content */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${step.gradient} opacity-40`}
                  >
                    {step.number}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <step.icon size={22} className="text-white" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{step.description}</p>
                <p className="text-sm text-slate-500 italic">{step.detail}</p>

                <ul className="grid grid-cols-2 gap-2">
                  {step.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className="flex-1">
                <div className={`glass border border-white/[0.08] rounded-2xl p-6 bg-gradient-to-br from-${step.color}-500/5 to-transparent relative overflow-hidden`}>
                  {/* Mock UI */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${step.gradient}`} />
                      <span className="text-xs text-slate-400 font-mono">Step {step.number} Preview</span>
                    </div>
                    {step.items.map((item, j) => (
                      <motion.div
                        key={item}
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: i * 0.15 + j * 0.1 + 0.3 }}
                        className="flex items-center justify-between glass rounded-lg px-4 py-3"
                      >
                        <span className="text-sm text-slate-300">{item}</span>
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center`}
                        >
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Decorative gradient blob */}
                  <div
                    className={`absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-r ${step.gradient} rounded-full blur-[60px] opacity-10`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
