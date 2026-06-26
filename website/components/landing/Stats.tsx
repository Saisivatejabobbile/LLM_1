"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  { value: 2400, suffix: "+", label: "Domain Experts", description: "Using SLM Forge daily" },
  { value: 15000, suffix: "+", label: "Models Trained", description: "Across all domains" },
  { value: 99.2, suffix: "%", label: "Training Success Rate", description: "Jobs completed successfully", decimal: 1 },
  { value: 47, suffix: " min", label: "Avg Training Time", description: "From upload to export" },
];

export default function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute left-0 right-0 h-px top-0 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute left-0 right-0 h-px bottom-0 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/5 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="text-4xl md:text-5xl font-black gradient-text mb-2 leading-none">
                {inView ? (
                  <CountUp
                    end={stat.value}
                    duration={2.5}
                    delay={i * 0.15}
                    decimals={stat.decimal || 0}
                    suffix={stat.suffix}
                  />
                ) : (
                  "0"
                )}
              </div>
              <p className="text-white font-semibold mb-1">{stat.label}</p>
              <p className="text-sm text-slate-500">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
