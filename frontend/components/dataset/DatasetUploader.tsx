'use client'

import React, { useCallback, useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface DatasetUploaderProps {
  projectId: string
  onUploadSuccess: (rowCount: number) => void
}

export default function DatasetUploader({ projectId, onUploadSuccess }: DatasetUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileType = droppedFile.name.split('.').pop()?.toLowerCase()
      if (['jsonl', 'txt', 'pdf'].includes(fileType || '')) {
        setFile(droppedFile)
      } else {
        toast.error('Invalid file type. Please upload a .jsonl, .txt, or .pdf file.')
      }
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase()
      if (['jsonl', 'txt', 'pdf'].includes(fileType || '')) {
        setFile(selectedFile)
      } else {
        toast.error('Invalid file type. Please upload a .jsonl, .txt, or .pdf file.')
      }
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const response = await api.dataset.upload(projectId, file)
      toast.success(response.message || `Uploaded successfully: ${response.totalRows} rows loaded.`)
      
      // If it is TXT or PDF, trigger auto-formatting
      const fileType = file.name.split('.').pop()?.toLowerCase()
      if (fileType === 'txt' || fileType === 'pdf') {
        toast.info('Processing and auto-formatting your raw text dataset...')
        await api.dataset.autoFormat(projectId)
        toast.success('Auto-formatting complete!')
      }

      onUploadSuccess(response.totalRows)
      setFile(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to upload dataset. Check format.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="border border-purple-900/30 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
      <CardContent className="p-8">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
            isDragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".jsonl,.txt,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center cursor-pointer">
            {uploading ? (
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
            ) : file ? (
              <FileText className="h-12 w-12 text-cyan-400 mb-4 animate-bounce" />
            ) : (
              <Upload className="h-12 w-12 text-slate-500 mb-4 transition-colors group-hover:text-purple-400" />
            )}

            <div className="text-center">
              {file ? (
                <>
                  <p className="text-lg font-medium text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-slate-200">
                    Drag & drop your dataset file, or <span className="text-purple-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Supports JSONL (JSON lines format), raw Text (.txt) or PDF documents
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

        {file && (
          <div className="flex gap-4 mt-6 justify-end">
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              disabled={uploading}
              className="border-slate-800 hover:bg-slate-950 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-500/20"
            >
              {uploading ? 'Uploading...' : 'Process Dataset'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
