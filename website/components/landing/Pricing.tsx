"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Zap, Building2, User, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    icon: User,
    price: { monthly: 0, yearly: 0 },
    description: "For individual researchers and learners",
    color: "from-slate-500 to-slate-600",
    border: "border-white/[0.08]",
    buttonStyle: "bg-white/[0.08] hover:bg-white/[0.12] text-white",
    features: [
      "3 fine-tuning jobs / month",
      "Up to 10MB dataset",
      "Phi-3 Mini & Gemma 2 2B",
      "4-bit quantization",
      "Community support",
      "GGUF export",
      "7-day job history",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    icon: Zap,
    price: { monthly: 49, yearly: 39 },
    description: "For domain experts and small teams",
    color: "from-violet-500 to-purple-600",
    border: "border-violet-500/50",
    buttonStyle: "btn-primary text-white",
    features: [
      "Unlimited fine-tuning jobs",
      "Up to 500MB dataset",
      "All 5 models",
      "4-bit & 8-bit quantization",
      "Priority GPU queue",
      "A/B evaluation suite",
      "Webhook notifications",
      "90-day job history",
      "Email support (24h)",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: { monthly: 249, yearly: 199 },
    description: "For teams and regulated industries",
    color: "from-amber-500 to-orange-600",
    border: "border-amber-500/30",
    buttonStyle: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30",
    features: [
      "Everything in Pro",
      "Unlimited dataset size",
      "Private GPU cluster",
      "On-premise deployment",
      "SSO / SAML integration",
      "HIPAA BAA included",
      "SOC 2 Type II",
      "Custom model integrations",
      "Dedicated account manager",
      "SLA 99.9% uptime",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-900/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass border border-amber-500/30 rounded-full px-4 py-2 mb-6 text-sm text-amber-300">
            <Rocket size={14} />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Start free.
            <br />
            <span className="gradient-text">Scale as you grow.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
            No hidden fees. No surprise bills. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 glass border border-white/[0.08] rounded-full p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                yearly ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative glass border ${plan.border} rounded-2xl p-7 card-hover ${
                plan.highlighted ? "ring-1 ring-violet-500/40 scale-105" : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-violet-500/30">
                  Most Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                >
                  <plan.icon size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-7">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-white">
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-slate-500 mb-2">/mo</span>
                  )}
                  {plan.price.monthly === 0 && (
                    <span className="text-slate-500 mb-2">forever</span>
                  )}
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Billed ${plan.price.yearly * 12}/year · Save ${(plan.price.monthly - plan.price.yearly) * 12}/yr
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm mb-7 transition-all duration-300 ${plan.buttonStyle}`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
