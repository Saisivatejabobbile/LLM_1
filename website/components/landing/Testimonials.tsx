"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Chief of Oncology, Stanford Medical",
    avatar: "👩‍⚕️",
    content:
      "We fine-tuned a Phi-3 model on 50,000 clinical notes in 2 hours. The model now assists our residents with differential diagnoses with 94% accuracy. SLM Forge saved us 6 months of ML engineering.",
    rating: 5,
    tag: "Healthcare",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    name: "Marcus Williams",
    role: "Senior Partner, Williams & Associates Law",
    avatar: "⚖️",
    content:
      "I trained a contract review model with no technical background. Upload PDFs, click Train, done. The resulting Ollama model runs offline — critical for client confidentiality. Absolutely transformative.",
    rating: 5,
    tag: "Legal",
    tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    name: "Priya Nair",
    role: "Lead Engineer, Rolls-Royce Aerospace",
    avatar: "✈️",
    content:
      "Our maintenance manual chatbot fine-tuned on Llama 3.2 handles 80% of technician queries autonomously. Deployment was literally dragging a GGUF file into Ollama. Never thought AI would be this accessible.",
    rating: 5,
    tag: "Engineering",
    tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    name: "James O'Brien",
    role: "VP of Product, FinTech Startup",
    avatar: "💼",
    content:
      "We A/B tested our customer support model against GPT-4 using SLM Forge's evaluation suite. Our fine-tuned Mistral 7B model scored 8% higher on domain-specific tasks and costs 99% less to run.",
    rating: 5,
    tag: "Finance",
    tagColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    name: "Elena Vasquez",
    role: "NLP Researcher, UC Berkeley",
    avatar: "🔬",
    content:
      "I use SLM Forge for rapid prototyping. What used to take a week of coding now takes 30 minutes. The live loss curves and checkpoint management are genuinely better than running Transformers locally.",
    rating: 5,
    tag: "Research",
    tagColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
  {
    name: "David Kim",
    role: "CTO, EdTech Platform",
    avatar: "🎓",
    content:
      "SLM Forge's multilingual support via Qwen2.5 let us build a Spanish and Portuguese tutoring model for our LATAM markets in one weekend. The ROI is insane compared to API costs.",
    rating: 5,
    tag: "Education",
    tagColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-900/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2 mb-6 text-sm text-violet-300">
            <Quote size={14} />
            <span>Loved by Experts Worldwide</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-5">
            Real results from
            <br />
            <span className="gradient-text">real domain experts</span>
          </h2>
        </motion.div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass border border-white/[0.06] rounded-2xl p-6 break-inside-avoid card-hover mb-5"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md border ${t.tagColor}`}>{t.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
