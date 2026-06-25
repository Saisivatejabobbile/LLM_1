'use client'

import React, { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Terminal, Activity, Loader2, Play, AlertCircle, XCircle } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { TrainingJob, LossDataPoint } from '@/lib/types'

interface TrainingProgressProps {
  job: TrainingJob | null
  onCancelJob: () => void
  chartData: LossDataPoint[]
}

export default function TrainingProgress({ job, onCancelJob, chartData }: TrainingProgressProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [job?.logs?.length])

  if (!job) return null

  const isRunning = job.status === 'running'
  const isPending = job.status === 'pending'
  const isFinished = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-emerald-950/40 text-emerald-400 border-emerald-800/30">Running</Badge>
      case 'pending':
        return <Badge className="bg-amber-950/40 text-amber-400 border-amber-800/30">Queued</Badge>
      case 'completed':
        return <Badge className="bg-indigo-950/40 text-indigo-400 border-indigo-800/30">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-950/40 text-red-400 border-red-800/30">Failed</Badge>
      case 'cancelled':
        return <Badge className="bg-slate-950/40 text-slate-400 border-slate-800/30">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Status Card */}
      <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6 mb-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-mono">Job ID: {job.id}</span>
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                Training Status: {getStatusBadge(job.status)}
              </h2>
            </div>
            {isRunning && (
              <Button
                variant="destructive"
                onClick={onCancelJob}
                className="bg-red-600/80 hover:bg-red-700 text-white gap-2 flex items-center border border-red-800/20"
              >
                <XCircle className="h-4 w-4" />
                Cancel Training
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">PROGRESS</p>
              <p className="text-2xl font-bold text-slate-200">{job.progress.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">CURRENT LOSS</p>
              <p className="text-2xl font-bold text-cyan-400 font-mono">
                {job.loss ? job.loss.toFixed(4) : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">EPOCH</p>
              <p className="text-2xl font-bold text-slate-200">
                {job.currentEpoch} / {job.totalEpochs}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium">STEP</p>
              <p className="text-2xl font-bold text-slate-200">
                {job.currentStep} / {job.totalSteps}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <Progress value={job.progress} className="h-2 bg-slate-900 border border-slate-800" />
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>Started: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'Pending'}</span>
              {isRunning && <span>Processing LoRA adaptation...</span>}
              {job.completedAt && (
                <span>Finished: {new Date(job.completedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loss Curves & Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism flex flex-col">
          <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
            <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Loss Convergence Curve
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="text-sm">Waiting for first metrics epoch callback...</p>
              </div>
            ) : (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                    <XAxis
                      dataKey="step"
                      stroke="#4b5563"
                      fontSize={11}
                      tickLine={false}
                      label={{ value: 'Steps', position: 'insideBottomRight', offset: -5, fill: '#4b5563', fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      fontSize={11}
                      tickLine={false}
                      label={{ value: 'Training Loss', angle: -90, position: 'insideLeft', fill: '#4b5563', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1f2937', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#c084fc', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      name="Train Loss"
                      stroke="#c084fc"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    {chartData.some((d) => d.evalLoss !== undefined) && (
                      <Line
                        type="monotone"
                        dataKey="evalLoss"
                        name="Eval Loss"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Console / Terminal logs */}
        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism flex flex-col h-[380px] lg:h-auto">
          <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
            <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-purple-400" />
              Console Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 bg-slate-950/60 font-mono text-xs text-slate-300 overflow-y-auto max-h-[300px] lg:max-h-[320px] scrollbar-thin">
            <div className="space-y-1.5">
              {job.logs && job.logs.length > 0 ? (
                job.logs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    <span className="text-purple-400 select-none">$&nbsp;</span>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic">No output logs received yet. Enqueuing task...</div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
