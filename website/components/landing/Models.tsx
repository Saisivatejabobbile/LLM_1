"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Cpu, Zap, Star, ExternalLink } from "lucide-react";

const models = [
  {
    name: "Phi-3 Mini",
    maker: "Microsoft",
    params: "3.8B",
    badge: "Best for Medical",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    description:
      "Exceptional reasoning in a small footprint. Perfect for clinical notes, drug interactions, and medical Q&A.",
    specs: { ram: "4GB VRAM", speed: "52 tok/s", quant: "4-bit" },
    gradient: "from-blue-500/20 to-indigo-600/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    star: 4.9,
    tags: ["Medical", "Q&A", "Reasoning"],
  },
  {
    name: "Gemma 2 2B",
    maker: "Google",
    params: "2B",
    badge: "Best for Legal",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    description:
      "Google's efficient transformer architecture excels at document summarization and structured legal analysis.",
    specs: { ram: "3GB VRAM", speed: "68 tok/s", quant: "4-bit" },
    gradient: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    star: 4.8,
    tags: ["Legal", "Summarization", "Analysis"],
  },
  {
    name: "Llama 3.2 3B",
    maker: "Meta",
    params: "3B",
    badge: "Most Popular",
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    description:
      "Meta's latest 3B model with impressive instruction-following. Ideal for customer support and chatbots.",
    specs: { ram: "4GB VRAM", speed: "58 tok/s", quant: "4-bit" },
    gradient: "from-violet-500/20 to-purple-600/10",
    border: "border-violet-500/20 hover:border-violet-500/40",
    star: 4.9,
    tags: ["Customer Support", "Chat", "General"],
    popular: true,
  },
  {
    name: "Mistral 7B",
    maker: "Mistral AI",
    params: "7B",
    badge: "Best Quality",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    description:
      "Best overall quality at 7B scale. Ideal for complex technical writing, code generation, and engineering.",
    specs: { ram: "8GB VRAM", speed: "35 tok/s", quant: "4-bit" },
    gradient: "from-cyan-500/20 to-teal-600/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    star: 4.8,
    tags: ["Technical", "Code", "Engineering"],
  },
  {
    name: "Qwen2.5 3B",
    maker: "Alibaba",
    params: "3B",
    badge: "Multilingual",
    badgeColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    description:
      "Outstanding multilingual capabilities. Perfect for global teams needing models in 30+ languages.",
    specs: { ram: "4GB VRAM", speed: "61 tok/s", quant: "4-bit" },
    gradient: "from-pink-500/20 to-rose-600/10",
    border: "border-pink-500/20 hover:border-pink-500/40",
    star: 4.7,
    tags: ["Multilingual", "Global", "Translation"],
  },
];

export default function Models() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="models" className="relative py-32 overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-900/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-cyan-500/30 rounded-full px-4 py-2 mb-6 text-sm text-cyan-300">
            <Cpu size={14} />
            <span>5 Supported Models</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Pick the right model
            <br />
            <span className="gradient-text">for your domain</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Every model is pre-optimized for LoRA fine-tuning. We handle all the quantization and
            memory management automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.map((model, i) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative glass border ${model.border} rounded-2xl p-6 bg-gradient-to-br ${model.gradient} card-hover group transition-all duration-300 ${
                model.popular ? "ring-1 ring-violet-500/40" : ""
              }`}
            >
              {model.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-violet-500/30">
                  ⭐ Most Popular
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{model.name}</h3>
                  <p className="text-sm text-slate-500">by {model.maker}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-semibold">{model.star}</span>
                </div>
              </div>

              <span
                className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-md border mb-3 ${model.badgeColor}`}
              >
                {model.badge}
              </span>

              <p className="text-sm text-slate-400 leading-relaxed mb-4">{model.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {model.tags.map((tag) => (
                  <span key={tag} className="text-xs text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.06]">
                {[
                  { label: "VRAM", value: model.specs.ram },
                  { label: "Speed", value: model.specs.speed },
                  { label: "Quant", value: model.specs.quant },
                ].map((spec) => (
                  <div key={spec.label} className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">{spec.label}</p>
                    <p className="text-sm font-semibold text-white">{spec.value}</p>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-0 right-0 m-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={14} className="text-slate-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
