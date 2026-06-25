'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'
import { Project } from '@/lib/types'
import ProjectCard from '@/components/projects/ProjectCard'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const list = await api.projects.list()
        setProjects(list)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load projects list')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Your Fine-Tuning Projects
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Choose a project to configure datasets, train models, check metrics, and deploy.
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

      {/* Search Filter bar */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-900/40 border-slate-800 text-slate-200 placeholder-slate-500"
        />
      </div>

      {/* Grid container */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 border border-slate-850 bg-slate-950/20 rounded-2xl glassmorphism space-y-4">
          <p className="text-slate-500 text-sm">No projects matched your criteria.</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
            <Link href="/projects/new">Create First Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
