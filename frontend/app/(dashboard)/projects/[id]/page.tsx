'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Database, Settings2, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { Project, DatasetRow, TrainingJob, LossDataPoint, EvaluationResult, TrainingConfig } from '@/lib/types'
import DatasetUploader from '@/components/dataset/DatasetUploader'
import DatasetTable from '@/components/dataset/DatasetTable'
import HardwareWarning from '@/components/training/HardwareWarning'
import TrainingForm from '@/components/training/TrainingForm'
import TrainingProgress from '@/components/training/TrainingProgress'
import MetricsCard from '@/components/evaluation/MetricsCard'
import ComparisonTable from '@/components/evaluation/ComparisonTable'
import DeployPanel from '@/components/deploy/DeployPanel'
import { toast } from 'sonner'
import io from 'socket.io-client'

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id

  const [project, setProject] = useState<Project | null>(null)
  const [datasetRows, setDatasetRows] = useState<DatasetRow[]>([])
  const [activeJob, setActiveJob] = useState<TrainingJob | null>(null)
  const [chartData, setChartData] = useState<LossDataPoint[]>([])
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalRunning, setEvalRunning] = useState(false)

  // Fetch all dependencies
  const loadProjectData = async () => {
    try {
      const proj = await api.projects.get(projectId)
      setProject(proj)

      const rows = await api.dataset.getRows(projectId)
      setDatasetRows(rows)

      const jobs = await api.training.getJobs(projectId)
      const runningJob = jobs.find((j) => j.status === 'running' || j.status === 'pending')
      if (runningJob) {
        setActiveJob(runningJob)
        // Set historical chart points if logged
        if (runningJob.metrics) {
          try {
            const parsed = typeof runningJob.metrics === 'string' 
              ? JSON.parse(runningJob.metrics) 
              : runningJob.metrics
            if (Array.isArray(parsed.loss)) {
              setChartData(parsed.loss)
            }
          } catch(e) {}
        }
      } else {
        // If no running, set latest job
        const trainingJobs = jobs.filter((j) => j.type === 'training')
        if (trainingJobs.length > 0) {
          setActiveJob(trainingJobs[0])
          if (trainingJobs[0].metrics) {
            try {
              const parsed = typeof trainingJobs[0].metrics === 'string'
                ? JSON.parse(trainingJobs[0].metrics)
                : trainingJobs[0].metrics
              if (Array.isArray(parsed.loss)) {
                setChartData(parsed.loss)
              }
            } catch(e){}
          }
        }
      }

      try {
        const evals = await api.evaluation.getResults(projectId)
        setEvalResult(evals)
      } catch (e) {
        // Evaluation might not exist yet (returns 404)
        setEvalResult(null)
      }

    } catch (err) {
      console.error(err)
      toast.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  // Setup Socket.io client to listen for real-time progress callbacks
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'
    const socket = io(socketUrl)

    socket.on('connect', () => {
      // Room names correspond to individual project IDs or user namespaces
      socket.emit('join', projectId)
    })

    socket.on('job:progress', (data: any) => {
      if (data.jobId === activeJob?.id || (activeJob && data.projectId === projectId)) {
        setActiveJob((prev) => {
          if (!prev) return null
          return {
            ...prev,
            progress: data.progress,
            loss: data.loss,
            evalLoss: data.evalLoss,
            currentEpoch: data.epoch,
            currentStep: data.step,
            totalSteps: data.totalSteps,
            status: 'running',
          }
        })

        setChartData((prev) => {
          // Prevent duplicates
          if (prev.some((p) => p.step === data.step)) return prev
          return [...prev, { step: data.step, epoch: data.epoch, loss: data.loss, evalLoss: data.evalLoss }]
        })
      }
    })

    socket.on('job:complete', (data: any) => {
      toast.success('Job completed successfully!')
      loadProjectData()
    })

    socket.on('job:error', (data: any) => {
      toast.error(`Job error: ${data.error}`)
      loadProjectData()
    })

    return () => {
      socket.disconnect()
    }
  }, [projectId, activeJob?.id])

  const handleStartTraining = async (config: TrainingConfig) => {
    try {
      const job = await api.training.start(projectId, config)
      setActiveJob(job)
      setChartData([])
      toast.success('Training job scheduled successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to start training')
    }
  }

  const handleCancelJob = async () => {
    if (!activeJob) return
    try {
      await api.training.cancelJob(activeJob.id)
      toast.success('Training cancellation request sent')
      loadProjectData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel training job')
    }
  }

  const handleRunEvaluation = async () => {
    setEvalRunning(true)
    try {
      const response = await api.evaluation.run(projectId)
      toast.success('Evaluation job triggered in background...')
      
      // Poll evaluation job status
      const interval = setInterval(async () => {
        try {
          const job = await api.training.getJob(response.jobId)
          if (job.status === 'completed') {
            clearInterval(interval)
            toast.success('Evaluation complete!')
            const evals = await api.evaluation.getResults(projectId)
            setEvalResult(evals)
            setEvalRunning(false)
          } else if (job.status === 'failed') {
            clearInterval(interval)
            toast.error('Evaluation failed')
            setEvalRunning(false)
          }
        } catch (e) {
          clearInterval(interval)
          setEvalRunning(false)
        }
      }, 5000)
    } catch (err: any) {
      setEvalRunning(false)
      toast.error(err.response?.data?.error || 'Failed to start evaluation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-slate-500">
        Project not found. <Link href="/projects" className="text-purple-400 underline">Go back</Link>
      </div>
    )
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
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" asChild className="text-slate-400 hover:text-slate-200 gap-1.5 -ml-3 pl-2 pr-3">
          <Link href="/projects">
            <ChevronLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </Button>
      </div>

      {/* Project Header details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-200">{project.name}</h1>
            <Badge className="bg-purple-950/40 text-purple-400 border border-purple-800/30">
              {modelFriendlyName(project.baseModelId)}
            </Badge>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">{project.description || 'No description provided.'}</p>
        </div>
      </div>

      {/* Dashboard Tabs navigation */}
      <Tabs defaultValue="dataset" className="w-full space-y-6">
        <TabsList className="bg-slate-950 border border-slate-800 w-full md:w-auto p-1 h-auto grid grid-cols-4 max-w-lg rounded-xl">
          <TabsTrigger value="dataset" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            <Database className="h-3.5 w-3.5 mr-2" /> Dataset
          </TabsTrigger>
          <TabsTrigger value="training" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            <Settings2 className="h-3.5 w-3.5 mr-2" /> Training
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            <Sparkles className="h-3.5 w-3.5 mr-2" /> Evaluation
          </TabsTrigger>
          <TabsTrigger value="deploy" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-purple-600 text-slate-400 data-[state=active]:text-white">
            <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Deploy
          </TabsTrigger>
        </TabsList>

        {/* Dataset View */}
        <TabsContent value="dataset" className="space-y-6 mt-0">
          <DatasetUploader projectId={project.id} onUploadSuccess={loadProjectData} />
          <DatasetTable projectId={project.id} initialRows={datasetRows} onRowsChange={loadProjectData} />
        </TabsContent>

        {/* Training config & tracker */}
        <TabsContent value="training" className="space-y-6 mt-0">
          {/* Resolve VRAM warning dynamically */}
          <HardwareWarning baseModel={project.baseModel || { id: project.baseModelId, name: modelFriendlyName(project.baseModelId), hfModelId: '', description: '', maxVram: project.baseModelId === 'mistral-7b' ? 16 : 8, paramCount: '', isQuantizable: true }} />

          {activeJob && (activeJob.status === 'running' || activeJob.status === 'pending' || chartData.length > 0) ? (
            <TrainingProgress job={activeJob} onCancelJob={handleCancelJob} chartData={chartData} />
          ) : (
            <TrainingForm onStartTraining={handleStartTraining} isTraining={!!activeJob && (activeJob.status === 'running' || activeJob.status === 'pending')} rowCount={datasetRows.length} />
          )}
        </TabsContent>

        {/* A/B side-by-side evaluation */}
        <TabsContent value="evaluation" className="space-y-6 mt-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-200">Quantitative & Qualitative A/B Evaluation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Test responses against hold-out splits to measure BLEU/ROUGE improvements</p>
            </div>
            <Button
              onClick={handleRunEvaluation}
              disabled={evalRunning || datasetRows.length < 10}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {evalRunning ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Evaluating...</> : 'Run Evaluation'}
            </Button>
          </div>

          <MetricsCard result={evalResult} loading={evalLoading} />
          {evalResult && <ComparisonTable comparisons={evalResult.comparisons} />}
        </TabsContent>

        {/* Ollama modelfile builder / GGUF down */}
        <TabsContent value="deploy" className="mt-0">
          <DeployPanel project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
