'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { BaseModel } from '@/lib/types'
import { toast } from 'sonner'

export default function NewProjectPage() {
  const router = useRouter()
  const [models, setModels] = useState<BaseModel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseModelId, setBaseModelId] = useState('')

  useEffect(() => {
    async function loadModels() {
      try {
        const list = await api.models.list()
        setModels(list)
        if (list.length > 0) {
          setBaseModelId(list[0].id)
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to retrieve model registry')
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !baseModelId) {
      toast.error('Project Name and Base Model are required')
      return
    }

    setSubmitting(true)
    try {
      const project = await api.projects.create({
        name,
        description,
        baseModelId,
      })
      toast.success('Project created successfully!')
      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          asChild
          className="text-slate-400 hover:text-slate-200 gap-1.5 -ml-3 pl-2 pr-3"
        >
          <Link href="/projects">
            <ChevronLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </Button>
      </div>

      {/* Main Form container */}
      <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-6">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Create Fine-Tuning Project
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Define your project properties, chose your base model parameters, and prepare datasets.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs text-slate-400 font-medium">Project Name *</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Legal Contract Q&A"
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm focus:border-purple-500 focus:ring-purple-500"
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-desc" className="text-xs text-slate-400 font-medium">Description (Optional)</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary explaining what this custom LLM is fine-tuned to do..."
                className="bg-slate-950/80 border-slate-800 text-slate-200 text-sm focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-model" className="text-xs text-slate-400 font-medium">Base Language Model *</Label>
              <Select
                value={baseModelId}
                onValueChange={setBaseModelId}
                disabled={submitting}
              >
                <SelectTrigger id="base-model" className="bg-slate-950 border-slate-800 text-slate-200 text-sm focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="focus:bg-purple-600 focus:text-white cursor-pointer py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{model.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {model.paramCount} parameters • Requires {model.maxVram}GB VRAM
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-slate-800/80 pt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                asChild
                className="border-slate-850 text-slate-400 hover:bg-slate-950"
              >
                <Link href="/projects">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-purple-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
