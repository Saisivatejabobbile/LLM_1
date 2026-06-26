"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Do I need a GPU to use SLM Forge?",
    a: "No! For Pro and Enterprise users, we provide GPU compute through our cloud infrastructure. For Starter users, you can connect your own GPU or use our shared queue. All models are optimized for 4-bit quantization, so even an 8GB VRAM GPU can fine-tune 7B parameter models.",
  },
  {
    q: "How is my training data handled? Is it private?",
    a: "Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). It is never used to train any shared models. Enterprise customers can deploy SLM Forge on-premise for complete data sovereignty. We are SOC 2 Type II certified and offer HIPAA BAAs for healthcare customers.",
  },
  {
    q: "What dataset formats do you support?",
    a: "We support CSV, JSONL (instruction-response pairs), PDF (automatically extracted), plain text, and Hugging Face dataset format. Our AI-powered parser auto-detects the schema and converts it to the required training format. You can also upload raw Q&A pairs and we'll format them correctly.",
  },
  {
    q: "How long does fine-tuning take?",
    a: "Training time depends on dataset size and model. Typical times: Phi-3 Mini on 1,000 examples ≈ 15 minutes; Llama 3.2 3B on 10,000 examples ≈ 45 minutes; Mistral 7B on 10,000 examples ≈ 90 minutes. We optimize with gradient checkpointing and mixed-precision training to minimize time.",
  },
  {
    q: "What is GGUF and why should I care?",
    a: "GGUF is the standard format for running LLMs locally with Ollama, LM Studio, and llama.cpp. SLM Forge automatically merges your LoRA adapter into the base model, quantizes it to the selected precision, and exports a ready-to-run GGUF file. You can then `ollama run your-model` immediately.",
  },
  {
    q: "Can I fine-tune the same model multiple times?",
    a: "Yes! You can create multiple fine-tuning experiments within a project, compare them in the A/B evaluation suite, and merge the best adapter. You can also chain fine-tuning runs (fine-tune a previously fine-tuned model) for iterative improvement.",
  },
  {
    q: "Do you support custom model architectures?",
    a: "Currently we support Phi-3, Gemma 2, Llama 3.2, Mistral, and Qwen2.5. Enterprise customers can request custom model integrations. We're adding Falcon, Gemma 3, and Mistral Large support in Q3 2025.",
  },
];

function FAQItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className="glass border border-white/[0.06] rounded-2xl overflow-hidden card-hover"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-6 text-slate-400 leading-relaxed text-sm border-t border-white/[0.06] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2 mb-6 text-sm text-violet-300">
            <HelpCircle size={14} />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Got questions?
            <br />
            <span className="gradient-text">We've got answers.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} i={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500">
            Still have questions?{" "}
            <a href="mailto:support@slmforge.ai" className="text-violet-400 hover:text-violet-300 font-medium">
              Contact our team →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
