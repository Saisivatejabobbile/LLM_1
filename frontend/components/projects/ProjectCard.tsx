'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Database, Cpu, ArrowRight } from 'lucide-react'
import { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-slate-400 border-slate-800">Draft</Badge>
      case 'training':
        return <Badge className="bg-amber-950/40 text-amber-400 border-amber-800/30 animate-pulse">Training</Badge>
      case 'completed':
        return <Badge className="bg-indigo-950/40 text-indigo-400 border-indigo-800/30">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-950/40 text-red-400 border-red-800/30">Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const modelFriendlyName = (modelId: string) => {
    switch (modelId) {
      case 'phi-3-mini': return 'Phi-3 Mini (3.8B)'
      case 'gemma-2-2b': return 'Gemma 2 (2B)'
      case 'llama-3.2-3b': return 'Llama 3.2 (3B)'
      case 'mistral-7b': return 'Mistral (7B)'
      case 'qwen2.5-3b': return 'Qwen 2.5 (3B)'
      default: return modelId
    }
  }

  return (
    <Card className="border border-slate-850 hover:border-purple-500/30 bg-[#12121a]/60 backdrop-blur-md transition-all group hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 overflow-hidden glassmorphism flex flex-col justify-between h-[210px]">
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
          {getStatusBadge(project.status)}
        </div>
        <CardTitle className="text-md font-bold text-slate-200 mt-2 truncate group-hover:text-purple-400 transition-colors">
          {project.name}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
          {project.description || 'No description provided.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0 border-t border-slate-800/60 bg-slate-950/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            {modelFriendlyName(project.baseModelId)}
          </span>
          <span className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            {project.datasetRowCount || 0} rows
          </span>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 group/btn"
        >
          Manage
          <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
