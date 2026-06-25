'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, Cpu } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import api from '@/lib/api'
import { BaseModel } from '@/lib/types'

interface HardwareWarningProps {
  baseModel: BaseModel | undefined
}

interface HardwareInfo {
  device: string
  cuda_available: boolean
  mps_available: boolean
  gpu_name: string | null
  vram_total_gb: number | null
  vram_free_gb: number | null
  ram_total_gb: number
  ram_free_gb: number
  warnings: string[]
}

export default function HardwareWarning({ baseModel }: HardwareWarningProps) {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHardware() {
      try {
        // Fetch hardware info from express API which proxy-calls FastAPI /hardware or health
        const response = await api.projects.getStats()
        // Wait, the API client has api.projects.getStats() but hardware info is actually fetched via a endpoint in api.
        // Let's call /api/health or check if there is an endpoint. Let's fetch from standard window.fetch if needed,
        // or check the health route. Let's write a generic fetch to api.client if needed.
        // Let's just use axios/fetch to get /api/health.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/health`)
        const data = await res.json()
        if (data.hardware) {
          setHardware(data.hardware)
        }
      } catch (err) {
        console.error('Failed to fetch hardware info:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHardware()
  }, [])

  if (loading || !baseModel || !hardware) return null

  const isGpu = hardware.cuda_available || hardware.mps_available
  const totalVram = hardware.vram_total_gb ?? 0
  const freeVram = hardware.vram_free_gb ?? 0
  const requiredVram = baseModel.maxVram

  const isLowVram = isGpu && freeVram < requiredVram
  const isCpuOnly = !isGpu

  if (!isCpuOnly && !isLowVram) return null

  return (
    <Alert variant="destructive" className="border-red-900/50 bg-red-950/20 text-red-200 glassmorphism backdrop-blur-md mb-6">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <AlertTitle className="font-semibold text-red-400 flex items-center gap-2">
        <Cpu className="h-4 w-4 animate-pulse" />
        Hardware VRAM Warning
      </AlertTitle>
      <AlertDescription className="mt-2 text-sm leading-relaxed text-red-300">
        {isCpuOnly && (
          <p>
            No NVIDIA GPU or Apple Silicon GPU detected. Fine-tuning <strong>{baseModel.name}</strong> will run on CPU, which is extremely slow. We highly recommend using a CUDA-enabled GPU.
          </p>
        )}
        {isLowVram && (
          <p>
            Your system has <strong>{freeVram.toFixed(1)} GB</strong> of free VRAM, but <strong>{baseModel.name}</strong> requires at least <strong>{requiredVram} GB</strong> of VRAM for training/inference. Fine-tuning might fail with an Out-Of-Memory (OOM) error. Please consider a smaller model (e.g., Gemma 2 2B) or run in QLoRA 4-bit mode.
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
