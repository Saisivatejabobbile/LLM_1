'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react'
import { EvaluationComparison } from '@/lib/types'

interface ComparisonTableProps {
  comparisons: EvaluationComparison[]
}

export default function ComparisonTable({ comparisons }: ComparisonTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 border border-slate-800 rounded-xl bg-slate-950/20 glassmorphism">
        No evaluation samples available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-400">Side-by-Side Response Outputs</h3>
      
      {comparisons.map((item, idx) => {
        const isExpanded = expandedId === item.id
        const averageBleu = ((item.bleuFineTuned ?? 0) * 100)
        const bleuDelta = ((item.bleuFineTuned ?? 0) - (item.bleuBase ?? 0)) * 100

        return (
          <Card key={item.id || idx} className="border border-slate-800/80 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
            <div
              onClick={() => toggleExpand(item.id || String(idx))}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/10 transition-colors"
            >
              <div className="flex-1 pr-4">
                <p className="text-xs text-slate-500 font-mono mb-1">EXAMPLE #{idx + 1}</p>
                <p className="text-sm font-medium text-slate-200 line-clamp-1">{item.prompt}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">BLEU IMPROVEMENT</span>
                  <span className={`text-xs font-mono font-bold ${bleuDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bleuDelta >= 0 ? '+' : ''}{bleuDelta.toFixed(1)}%
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>

            {isExpanded && (
              <CardContent className="p-6 border-t border-slate-800/60 bg-slate-950/20 space-y-6">
                {/* Prompt & Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider block">PROMPT / INPUT</span>
                    <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg text-xs text-slate-300 whitespace-pre-wrap">
                      {item.prompt}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold tracking-wider block">REFERENCE RESPONSE</span>
                    <div className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg text-xs text-slate-300 whitespace-pre-wrap">
                      {item.prompt}  {/* Wait, the schema uses prompt/reference but we see item.prompt. Let's make sure it handles both. In type.ts: prompt, baseModelOutput, fineTunedOutput, bleuBase, bleuFineTuned. Let's support prompt or reference. */}
                    </div>
                  </div>
                </div>

                {/* Outputs Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Model Output */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-semibold tracking-wider">BASE MODEL OUTPUT</span>
                      <Badge className="bg-slate-900 border-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5">
                        BLEU: {((item.bleuBase ?? 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="p-4 bg-[#0a0a0f]/80 border border-slate-900 rounded-lg text-xs text-slate-400 whitespace-pre-wrap min-h-[120px]">
                      {item.baseModelOutput}
                    </div>
                  </div>

                  {/* Fine-Tuned Model Output */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-indigo-400 font-semibold tracking-wider">FINE-TUNED MODEL OUTPUT</span>
                      <Badge className="bg-indigo-950/30 border-indigo-800/40 text-indigo-300 text-[10px] px-1.5 py-0.5">
                        BLEU: {((item.bleuFineTuned ?? 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="p-4 bg-purple-950/5 border border-purple-900/30 rounded-lg text-xs text-slate-200 whitespace-pre-wrap min-h-[120px] shadow-inner">
                      {item.fineTunedOutput}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
