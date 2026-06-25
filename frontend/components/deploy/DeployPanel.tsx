'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Terminal, CloudLightning, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { Project, ExportJob, DeployConfig, DeployResult } from '@/lib/types'
import { toast } from 'sonner'

interface DeployPanelProps {
  project: Project
}

export default function DeployPanel({ project }: DeployPanelProps) {
  const [exportJob, setExportJob] = useState<ExportJob | null>(null)
  const [exporting, setExporting] = useState(false)
  const [deploying, setDeploying] = useState(false)

  // Deploy Config forms
  const [ollamaName, setOllamaName] = useState(project.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-ft')
  const [hfRepoId, setHfRepoId] = useState('')
  const [hfToken, setHfToken] = useState('')

  useEffect(() => {
    // Check if there is an active/completed export job already
    async function checkExport() {
      try {
        const jobs = await api.training.getJobs(project.id)
        const exportJobs = jobs.filter((j) => j.type === 'export')
        if (exportJobs.length > 0) {
          // Wrap TrainingJob as ExportJob mapping
          const latest = exportJobs[0]
          setExportJob({
            id: latest.id,
            projectId: latest.projectId,
            status: latest.status,
            format: 'gguf',
            createdAt: latest.createdAt,
            updatedAt: latest.updatedAt,
          })
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err)
      }
    }
    checkExport()
  }, [project.id])

  const triggerExport = async () => {
    setExporting(true)
    try {
      const job = await api.deploy.exportGGUF(project.id)
      setExportJob(job)
      toast.success('Export job started. Merging adapter weights and converting to GGUF in background...')
      
      // Poll for completion
      const interval = setInterval(async () => {
        try {
          const check = await api.training.getJob(job.id)
          if (check.status === 'completed') {
            clearInterval(interval)
            setExportJob({
              id: check.id,
              projectId: check.projectId,
              status: 'completed',
              format: 'gguf',
              downloadUrl: api.deploy.downloadUrl(project.id),
              createdAt: check.createdAt,
              updatedAt: check.updatedAt,
            })
            setExporting(false)
            toast.success('GGUF model is ready for download!')
          } else if (check.status === 'failed') {
            clearInterval(interval)
            setExportJob({
              id: check.id,
              projectId: check.projectId,
              status: 'failed',
              format: 'gguf',
              createdAt: check.createdAt,
              updatedAt: check.updatedAt,
            })
            setExporting(false)
            toast.error(check.errorMessage || 'Export failed')
          }
        } catch (err) {
          clearInterval(interval)
          setExporting(false)
        }
      }, 5000)
    } catch (err: any) {
      setExporting(false)
      toast.error(err.response?.data?.error || 'Failed to start GGUF export')
    }
  }

  const handleDeployOllama = async () => {
    if (!ollamaName) {
      toast.error('Ollama model name is required')
      return
    }
    setDeploying(true)
    try {
      const result = await api.deploy.deployOllama(project.id, {
        target: 'ollama',
        modelName: ollamaName,
      })
      if (result.success) {
        toast.success(`Model registered in Ollama successfully: ${ollamaName}`)
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deploy to Ollama')
    } finally {
      setDeploying(false)
    }
  }

  const handlePushHF = async () => {
    if (!hfRepoId) {
      toast.error('HuggingFace repository ID is required')
      return
    }
    setDeploying(true)
    try {
      const result = await api.deploy.pushHuggingFace(project.id, {
        target: 'huggingface',
        hfRepoId,
        hfToken,
      })
      if (result.success) {
        toast.success(`Model pushed to HuggingFace!`)
        if (result.hfUrl) {
          window.open(result.hfUrl, '_blank')
        }
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to push to HuggingFace')
    } finally {
      setDeploying(false)
    }
  }

  const isExportCompleted = exportJob?.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Step 1: Export GGUF */}
      <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
          <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
            <Download className="h-4.5 w-4.5 text-purple-400" />
            1. Compile Model to GGUF Format
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Merges the fine-tuned LoRA weights back into the base model parameters, quantizes the output to 4-bit (Q4_K_M), and outputs a GGUF file.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">EXPORT STATUS</span>
            <div className="flex items-center gap-2">
              {exportJob ? (
                <>
                  <span className={`text-sm font-semibold capitalize ${
                    exportJob.status === 'completed' ? 'text-indigo-400' :
                    exportJob.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {exportJob.status === 'running' ? 'Compiling weights...' : exportJob.status}
                  </span>
                  {exportJob.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
                </>
              ) : (
                <span className="text-sm text-slate-400">Not compiled yet</span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={triggerExport}
              disabled={exporting || (exportJob && exportJob.status === 'running')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2 flex items-center"
            >
              {exporting ? 'Processing GGUF...' : 'Compile to GGUF'}
            </Button>
            {isExportCompleted && (
              <Button
                variant="outline"
                asChild
                className="border-indigo-800 text-indigo-400 hover:bg-indigo-950/30"
              >
                <a href={api.deploy.downloadUrl(project.id)} download>
                  <Download className="h-4 w-4 mr-2" /> Download GGUF
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Local deploy or HuggingFace Push */}
      <Tabs defaultValue="ollama" className="w-full">
        <TabsList className="bg-slate-950 border border-slate-800 w-full md:w-auto p-1 h-auto grid grid-cols-2 max-w-sm rounded-xl">
          <TabsTrigger value="ollama" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            Ollama Deploy
          </TabsTrigger>
          <TabsTrigger value="huggingface" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            Hugging Face Hub
          </TabsTrigger>
        </TabsList>

        {/* Ollama Tab */}
        <TabsContent value="ollama" className="mt-4">
          <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
            <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
              <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-purple-400" />
                Register to Local Ollama Instance
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Generates a Modelfile referencing the compiled GGUF file and registers it directly inside your local Ollama environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!isExportCompleted && (
                <div className="p-4 border border-amber-900/30 bg-amber-950/10 text-amber-300 rounded-lg text-xs">
                  Compile your model weights to GGUF format (Step 1 above) before registering in Ollama.
                </div>
              )}

              <div className="space-y-2 max-w-md">
                <Label className="text-xs text-slate-400 font-medium">Ollama Model Name</Label>
                <Input
                  value={ollamaName}
                  onChange={(e) => setOllamaName(e.target.value)}
                  disabled={!isExportCompleted || deploying}
                  placeholder="e.g. medical-phi3-instruct"
                  className="bg-slate-950 border-slate-800 text-slate-200 text-sm font-mono"
                />
              </div>

              {isExportCompleted && (
                <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 font-mono text-[10px] text-slate-400 max-w-xl leading-relaxed">
                  <span className="text-purple-400 font-bold block mb-1"># Generated Modelfile</span>
                  FROM {project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.gguf<br />
                  TEMPLATE {"\"{{ .System }} {{ .Prompt }}\""}<br />
                  PARAMETER temperature 0.7<br />
                  PARAMETER top_p 0.9
                </div>
              )}

              <Button
                onClick={handleDeployOllama}
                disabled={!isExportCompleted || deploying}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deploying...
                  </>
                ) : (
                  <>
                    <CloudLightning className="h-4 w-4" /> Run in Ollama
                  </>
                )}
              </Button>

              {isExportCompleted && (
                <div className="border-t border-slate-800/60 pt-4 mt-2">
                  <h4 className="text-xs text-slate-500 font-medium mb-2">HOW TO RUN ON YOUR TERMINAL</h4>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-xs text-slate-200 flex justify-between items-center max-w-xl">
                    <span>ollama run {ollamaName}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HF Tab */}
        <TabsContent value="huggingface" className="mt-4">
          <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
            <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 py-4">
              <CardTitle className="text-md font-bold text-slate-200 flex items-center gap-2">
                <CloudLightning className="h-4.5 w-4.5 text-purple-400" />
                Upload Merged Weights to Hugging Face
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Pushes the full merged model weights directly to Hugging Face Hub under your repository namespace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!isExportCompleted && (
                <div className="p-4 border border-amber-900/30 bg-amber-950/10 text-amber-300 rounded-lg text-xs">
                  Compile your model weights to GGUF format (Step 1 above) before pushing to Hugging Face.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-medium">HuggingFace Repository ID</Label>
                  <Input
                    value={hfRepoId}
                    onChange={(e) => setHfRepoId(e.target.value)}
                    disabled={!isExportCompleted || deploying}
                    placeholder="username/model-repo-name"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-medium">HuggingFace Write Token (optional if logged in)</Label>
                  <Input
                    type="password"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    disabled={!isExportCompleted || deploying}
                    placeholder="hf_..."
                    className="bg-slate-950 border-slate-800 text-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handlePushHF}
                disabled={!isExportCompleted || deploying}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading to Hub...
                  </>
                ) : (
                  <>
                    <CloudLightning className="h-4 w-4" /> Push to Hugging Face Spaces
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
