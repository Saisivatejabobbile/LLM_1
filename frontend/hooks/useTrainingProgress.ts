'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { LossDataPoint, SocketJobProgress, SocketJobComplete, SocketJobError } from '@/lib/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'

interface TrainingProgressState {
  progress: number
  currentEpoch: number
  currentStep: number
  totalSteps: number
  loss: number | null
  evalLoss: number | null
  lossHistory: LossDataPoint[]
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'
  error: string | null
  isConnected: boolean
}

const initialState: TrainingProgressState = {
  progress: 0,
  currentEpoch: 0,
  currentStep: 0,
  totalSteps: 0,
  loss: null,
  evalLoss: null,
  lossHistory: [],
  status: 'idle',
  error: null,
  isConnected: false,
}

export function useTrainingProgress(jobId: string | null) {
  const [state, setState] = useState<TrainingProgressState>(initialState)
  const socketRef = useRef<Socket | null>(null)
  const lossHistoryRef = useRef<LossDataPoint[]>([])

  const reset = useCallback(() => {
    setState(initialState)
    lossHistoryRef.current = []
  }, [])

  useEffect(() => {
    if (!jobId) {
      reset()
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('slm_token') : null

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true }))
      // Subscribe to this specific job
      socket.emit('subscribe:job', { jobId })
    })

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, isConnected: false }))
    })

    socket.on('job:progress', (data: SocketJobProgress) => {
      if (data.jobId !== jobId) return

      const newPoint: LossDataPoint = {
        step: data.step,
        epoch: data.epoch,
        loss: data.loss,
        evalLoss: data.evalLoss || undefined,
      }

      lossHistoryRef.current = [...lossHistoryRef.current, newPoint]

      setState((prev) => ({
        ...prev,
        progress: data.progress,
        currentEpoch: data.epoch,
        currentStep: data.step,
        totalSteps: data.totalSteps,
        loss: data.loss,
        evalLoss: data.evalLoss,
        lossHistory: [...lossHistoryRef.current],
        status: 'running',
      }))
    })

    socket.on('job:complete', (data: SocketJobComplete) => {
      if (data.jobId !== jobId) return
      setState((prev) => ({
        ...prev,
        status: data.status as TrainingProgressState['status'],
        progress: data.status === 'completed' ? 100 : prev.progress,
      }))
    })

    socket.on('job:error', (data: SocketJobError) => {
      if (data.jobId !== jobId) return
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: data.error,
      }))
    })

    socket.on('job:cancelled', (data: { jobId: string }) => {
      if (data.jobId !== jobId) return
      setState((prev) => ({ ...prev, status: 'cancelled' }))
    })

    return () => {
      socket.emit('unsubscribe:job', { jobId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [jobId, reset])

  return {
    ...state,
    reset,
  }
}
