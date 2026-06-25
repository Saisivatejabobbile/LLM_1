'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Cpu, Database, Activity, LayoutGrid, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { StatsOverview } from '@/lib/types'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.projects.getStats()
        setStats(data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load dashboard statistics')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Overview Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and optimize custom Small Language Models for specialized tasks.
          </p>
        </div>

        <Button
          asChild
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 flex items-center shadow-lg shadow-purple-500/20"
        >
          <Link href="/projects/new">
            <Plus className="h-4.5 w-4.5" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-950/40 border border-purple-800/20 rounded-xl text-purple-400">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">TOTAL PROJECTS</p>
              <p className="text-2xl font-bold text-slate-200">{stats?.totalProjects ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-950/40 border border-amber-800/20 rounded-xl text-amber-400">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">RUNNING JOBS</p>
              <p className="text-2xl font-bold text-slate-200">{stats?.runningJobs ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/20 rounded-xl text-cyan-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">DATASET EXAMPLES</p>
              <p className="text-2xl font-bold text-slate-200">{stats?.totalDatasetRows ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/20 rounded-xl text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">ACTIVE DEPLOYS</p>
              <p className="text-2xl font-bold text-slate-200">{stats?.deployedModels ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
          <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-purple-400" />
            Recent Activity Logs
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Audit logs tracking job triggers, fine-tunes, dataset modifications and deployments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No recent activity logged.</div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    {activity.type.includes('complete') || activity.type.includes('deploy') ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-purple-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{activity.message}</p>
                      {activity.projectName && (
                        <p className="text-[10px] text-slate-500">Project: {activity.projectName}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
