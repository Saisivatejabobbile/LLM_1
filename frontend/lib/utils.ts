import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type JobStatus, type ProjectStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    pending: 'text-amber-400',
    running: 'text-cyan-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
    cancelled: 'text-slate-400',
  }
  return colors[status] ?? 'text-slate-400'
}

export function getJobStatusBg(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    pending: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    running: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
    completed: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    failed: 'bg-red-500/20 border-red-500/30 text-red-400',
    cancelled: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
  }
  return colors[status] ?? 'bg-slate-500/20 border-slate-500/30 text-slate-400'
}

export function getProjectStatusBg(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    draft: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
    training: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
    completed: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    failed: 'bg-red-500/20 border-red-500/30 text-red-400',
    deployed: 'bg-violet-500/20 border-violet-500/30 text-violet-400',
  }
  return colors[status] ?? 'bg-slate-500/20 border-slate-500/30 text-slate-400'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.substring(0, maxLength)}...`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseApiError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (err.response && typeof err.response === 'object') {
      const res = err.response as Record<string, unknown>
      if (res.data && typeof res.data === 'object') {
        const data = res.data as Record<string, unknown>
        if (typeof data.message === 'string') return data.message
        if (typeof data.error === 'string') return data.error
      }
    }
    if (typeof err.message === 'string') return err.message
  }
  return 'An unexpected error occurred'
}

export function formatLearningRate(lr: number): string {
  return lr.toExponential(0)
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function vramDisplay(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`
  return `${mb}MB`
}

export const VRAM_REQUIREMENTS: Record<string, number> = {
  'phi-3-mini': 4096,
  'gemma-2-2b': 6144,
  'llama-3.2-3b': 8192,
  'mistral-7b': 16384,
  'qwen2.5-3b': 8192,
}
