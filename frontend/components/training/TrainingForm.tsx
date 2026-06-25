'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle, Play, Settings } from 'lucide-react'
import { TrainingConfig } from '@/lib/types'

interface TrainingFormProps {
  onStartTraining: (config: TrainingConfig) => void
  isTraining: boolean
  rowCount: number
}

export default function TrainingForm({ onStartTraining, isTraining, rowCount }: TrainingFormProps) {
  // Safe default configurations for small datasets (50-200 examples)
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 3,
    learningRate: 0.0002,
    loraRank: 16,
    loraAlpha: 32,
    loraDropout: 0.1,
    batchSize: 4,
    warmupSteps: 10,
    maxSeqLength: 512,
    useQLoRA: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartTraining(config)
  }

  const handleSliderChange = (field: keyof TrainingConfig, value: number[]) => {
    setConfig((prev) => ({ ...prev, [field]: value[0] }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-5">
          <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            Hyperparameter Configuration
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Fine-tune options customized automatically for small datasets ({rowCount} items)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Epochs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                  Training Epochs
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                        Number of full passes through the training dataset. We recommend 3 epochs for small datasets to prevent overfitting.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/20">
                  {config.epochs}
                </span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[config.epochs]}
                onValueChange={(val) => handleSliderChange('epochs', val)}
                disabled={isTraining}
                className="py-2"
              />
            </div>

            {/* Learning Rate */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                Learning Rate
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                      Controls step size during optimization. Standard LoRA fine-tuning recommends 2e-4 (0.0002).
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="0.00001"
                min="0.00001"
                max="0.01"
                value={config.learningRate}
                onChange={(e) => setConfig((prev) => ({ ...prev, learningRate: parseFloat(e.target.value) || 0.0002 }))}
                disabled={isTraining}
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm font-mono"
              />
            </div>

            {/* LoRA Rank */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                  LoRA Rank (R)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                        Dimension of the adapter matrices. Higher ranks learn more complex patterns but increase memory consumption and file size. 16 is standard.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/20">
                  {config.loraRank}
                </span>
              </div>
              <Slider
                min={4}
                max={64}
                step={4}
                value={[config.loraRank]}
                onValueChange={(val) => {
                  const rank = val[0]
                  setConfig((prev) => ({
                    ...prev,
                    loraRank: rank,
                    loraAlpha: rank * 2, // Standard rule is alpha = 2 * rank
                  }))
                }}
                disabled={isTraining}
                className="py-2"
              />
            </div>

            {/* LoRA Alpha */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                LoRA Alpha (Scaling Factor)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                      Scaling factor for LoRA updates. Generally configured to be exactly double the LoRA Rank.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                value={config.loraAlpha}
                onChange={(e) => setConfig((prev) => ({ ...prev, loraAlpha: parseInt(e.target.value) || 32 }))}
                disabled={isTraining}
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm font-mono"
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                Per Device Batch Size
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                      Number of training examples processed per step. Lower values save VRAM. Default is 4.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                min="1"
                max="32"
                value={config.batchSize}
                onChange={(e) => setConfig((prev) => ({ ...prev, batchSize: parseInt(e.target.value) || 4 }))}
                disabled={isTraining}
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm font-mono"
              />
            </div>

            {/* Max Sequence Length */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1.5">
                Max Sequence Length (Tokens)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-xs text-xs">
                      Truncates inputs to this limit. Shorter lengths reduce VRAM usage. Default is 512.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="64"
                min="128"
                max="2048"
                value={config.maxSeqLength}
                onChange={(e) => setConfig((prev) => ({ ...prev, maxSeqLength: parseInt(e.target.value) || 512 }))}
                disabled={isTraining}
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            {/* QLoRA 4-bit config */}
            <div className="flex items-center space-x-3">
              <Switch
                id="qlora-toggle"
                checked={config.useQLoRA}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, useQLoRA: checked }))}
                disabled={isTraining}
              />
              <div className="space-y-0.5">
                <Label htmlFor="qlora-toggle" className="text-slate-300 text-sm font-medium">
                  Enable QLoRA (4-bit Quantization)
                </Label>
                <p className="text-xs text-slate-500">
                  Quantizes base weights to 4-bit to save 50%+ VRAM during training
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isTraining || rowCount < 10}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-purple-500/20 px-8 py-5 text-sm gap-2 h-auto flex items-center justify-center w-full md:w-auto"
            >
              <Play className="h-4 w-4 fill-white" />
              {isTraining ? 'Training Active...' : 'Launch Training Job'}
            </Button>
          </div>

          {rowCount < 10 && (
            <p className="text-xs text-amber-500 mt-2 text-center md:text-left">
              * A minimum of 10 examples is required to start training (your dataset has {rowCount} examples).
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
