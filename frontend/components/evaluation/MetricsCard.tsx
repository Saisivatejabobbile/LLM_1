'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TrendingUp, AlertCircle, Award } from 'lucide-react'
import { EvaluationResult } from '@/lib/types'

interface MetricsCardProps {
  result: EvaluationResult | null
  loading: boolean
}

export default function MetricsCard({ result, loading }: MetricsCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-slate-800 bg-[#12121a]/30 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  if (!result) {
    return (
      <Alert className="border-indigo-900/30 bg-indigo-950/10 text-indigo-200 glassmorphism mb-6">
        <AlertCircle className="h-5 w-5 text-indigo-400" />
        <AlertTitle className="font-semibold text-indigo-300">Model Evaluation Required</AlertTitle>
        <AlertDescription className="mt-1 text-sm text-indigo-400">
          Run the evaluation pipeline to compute quantitative scores (BLEU, ROUGE) comparing your fine-tuned model against the base weights.
        </AlertDescription>
      </Alert>
    )
  }

  const formatScore = (val: number | undefined) => {
    if (val === undefined || val === null) return '—'
    return (val * 100).toFixed(1) + '%'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider block">BLEU SCORE</span>
            <span className="text-3xl font-extrabold text-purple-400 font-mono">
              {formatScore(result.bleuScore)}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-400" /> Bilingual Evaluation
            </span>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider block">ROUGE-L SCORE</span>
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {formatScore(result.rougeL)}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              Longest Common Subsequence
            </span>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider block">ROUGE-1 SCORE</span>
            <span className="text-3xl font-extrabold text-slate-200 font-mono">
              {formatScore(result.rouge1)}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              Unigram Co-occurrence
            </span>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider block">ROUGE-2 SCORE</span>
            <span className="text-3xl font-extrabold text-slate-200 font-mono">
              {formatScore(result.rouge2)}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              Bigram Co-occurrence
            </span>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-emerald-950/30 bg-emerald-950/10 text-emerald-200 glassmorphism">
        <Award className="h-5 w-5 text-emerald-400" />
        <AlertTitle className="font-semibold text-emerald-300">Metrics Breakdown</AlertTitle>
        <AlertDescription className="mt-1 text-xs text-emerald-400">
          Scores are computed on a 20% held-out test split of your dataset. A BLEU score above 25% represents strong alignment for domain-specific fine-tuning tasks.
        </AlertDescription>
      </Alert>
    </div>
  )
}
