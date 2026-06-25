'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Brain,
  Zap,
  Database,
  ChartLine,
  Rocket,
  Shield,
  ArrowRight,
  Github,
  Star,
  CheckCircle,
  Cpu,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Database,
    title: 'Dataset Management',
    description: 'Upload JSONL, CSV, or TXT files. Edit rows inline, add examples manually, auto-format to instruction-following.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Brain,
    title: 'LoRA / QLoRA Training',
    description: 'Fine-tune Phi-3, Gemma, Llama, Mistral and more with configurable LoRA rank, learning rate, and batch size.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: ChartLine,
    title: 'Live Training Metrics',
    description: 'Real-time loss chart via WebSocket. Watch train loss and eval loss converge step by step.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'A/B Evaluation',
    description: 'Compare base model vs fine-tuned side by side with BLEU and ROUGE-L scores automatically computed.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description: 'Export to GGUF, deploy to local Ollama, or push directly to HuggingFace Hub with your token.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: Shield,
    title: 'VRAM-Aware Config',
    description: '4-bit quantization (QLoRA) by default for consumer GPUs. VRAM warning before training begins.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
]

const models = [
  { name: 'Phi-3 Mini', params: '3.8B', vram: '4GB', badge: 'Fast' },
  { name: 'Gemma 2 2B', params: '2.6B', vram: '6GB', badge: 'Small' },
  { name: 'Llama 3.2 3B', params: '3.2B', vram: '8GB', badge: 'Popular' },
  { name: 'Mistral 7B', params: '7B', vram: '16GB', badge: 'Powerful' },
  { name: 'Qwen 2.5 3B', params: '3B', vram: '8GB', badge: 'Efficient' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 hero-gradient pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow-primary">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient-primary">SLM Forge</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Fine-tune SLMs in minutes, not hours
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold leading-[1.1] mb-6 text-gradient-hero">
              Forge Your Own
              <br />
              Language Model
            </h1>

            <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              SLM Forge gives you a beautiful, professional interface to fine-tune small language
              models with LoRA and QLoRA. Upload data, train, evaluate, and deploy — all in one
              stunning dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="gradient" asChild className="group">
                <Link href="/register">
                  Start Fine-tuning Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">
                  <Github className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero metrics */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: '5+', label: 'Base Models' },
              { value: '4-bit', label: 'QLoRA' },
              { value: '<1hr', label: 'Training Time' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gradient-primary">{stat.value}</div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Fake terminal / demo */}
      <section className="relative z-10 px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-2xl border border-border overflow-hidden shadow-2xl shadow-primary/10">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-3 text-xs text-muted font-mono">SLM Forge Training Monitor</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-2">
              <p className="text-muted"># Starting QLoRA fine-tuning with Llama 3.2 3B...</p>
              <p>
                <span className="text-cyan-400">{'>'}</span>{' '}
                <span className="text-text">Loading model: </span>
                <span className="text-emerald-400">meta-llama/Llama-3.2-3B-Instruct</span>
              </p>
              <p>
                <span className="text-cyan-400">{'>'}</span>{' '}
                <span className="text-text">Dataset rows: </span>
                <span className="text-amber-400">142</span>
              </p>
              <p>
                <span className="text-cyan-400">{'>'}</span>{' '}
                <span className="text-text">LoRA rank: </span>
                <span className="text-violet-400">16</span>{' '}
                <span className="text-text">| alpha: </span>
                <span className="text-violet-400">32</span>
              </p>
              <div className="mt-3 space-y-1">
                {[
                  { epoch: 1, step: 35, loss: 1.8423, evalLoss: 1.9102 },
                  { epoch: 2, step: 70, loss: 1.2341, evalLoss: 1.3456 },
                  { epoch: 3, step: 105, loss: 0.8912, evalLoss: 0.9234 },
                ].map((row) => (
                  <p key={row.step} className="text-xs">
                    <span className="text-emerald-400">[Epoch {row.epoch}/3]</span>{' '}
                    <span className="text-muted">step {row.step}/105 |</span>{' '}
                    <span className="text-cyan-400">loss: {row.loss.toFixed(4)}</span>{' '}
                    <span className="text-muted">|</span>{' '}
                    <span className="text-amber-400">eval_loss: {row.evalLoss.toFixed(4)}</span>
                  </p>
                ))}
              </div>
              <p className="mt-3">
                <span className="text-emerald-400">✓</span>{' '}
                <span className="text-emerald-400 font-medium">Training complete!</span>{' '}
                <span className="text-muted">GGUF export ready.</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gradient-hero">Everything You Need</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              From raw data to deployed model — SLM Forge handles the entire fine-tuning pipeline
              with a beautiful, professional interface.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                className={`rounded-xl border p-6 ${feature.bg} card-hover-glow`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.bg}`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Models */}
      <section className="relative z-10 px-6 py-20 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">Supported Base Models</h2>
            <p className="text-muted">
              State-of-the-art small language models ready to be fine-tuned
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {models.map((model, i) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 text-center card-hover-glow"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-3">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div className="font-semibold text-sm text-text">{model.name}</div>
                <div className="text-xs text-muted mt-1">{model.params} • {model.vram} VRAM</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary border border-primary/30">
                  {model.badge}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 border-t border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="glass rounded-2xl p-12 border border-primary/20 bg-primary/5">
            <Star className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4 text-gradient-hero">
              Ready to Forge Your Model?
            </h2>
            <p className="text-muted text-lg mb-8">
              Join and start fine-tuning your first language model in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild className="group">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted">
              {['No credit card', 'Local deployment', 'Open source models'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span>SLM Forge © 2025</span>
          </div>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-text transition-colors">Docs</Link>
            <Link href="/privacy" className="hover:text-text transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
