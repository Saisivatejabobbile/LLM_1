import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  User,
  AuthResponse,
  Project,
  CreateProjectPayload,
  BaseModel,
  DatasetRow,
  DatasetUploadResponse,
  TrainingJob,
  TrainingConfig,
  EvaluationResult,
  ExportJob,
  DeployConfig,
  DeployResult,
  StatsOverview,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Request interceptor — attach JWT
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('slm_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor — handle 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('slm_token')
          localStorage.removeItem('slm_user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request(config)
    return response.data
  }

  // ─── Auth ────────────────────────────────────────────────
  auth = {
    register: (data: { email: string; password: string; name: string }) =>
      this.request<AuthResponse>({ method: 'POST', url: '/api/auth/register', data }),

    login: (data: { email: string; password: string }) =>
      this.request<AuthResponse>({ method: 'POST', url: '/api/auth/login', data }),

    me: () =>
      this.request<User>({ method: 'GET', url: '/api/auth/me' }),
  }

  // ─── Projects ─────────────────────────────────────────────
  projects = {
    list: () =>
      this.request<Project[]>({ method: 'GET', url: '/api/projects' }),

    get: (id: string) =>
      this.request<Project>({ method: 'GET', url: `/api/projects/${id}` }),

    create: (data: CreateProjectPayload) =>
      this.request<Project>({ method: 'POST', url: '/api/projects', data }),

    update: (id: string, data: Partial<Project>) =>
      this.request<Project>({ method: 'PUT', url: `/api/projects/${id}`, data }),

    delete: (id: string) =>
      this.request<{ success: boolean }>({ method: 'DELETE', url: `/api/projects/${id}` }),

    getStats: () =>
      this.request<StatsOverview>({ method: 'GET', url: '/api/projects/stats' }),
  }

  // ─── Dataset ──────────────────────────────────────────────
  dataset = {
    upload: (projectId: string, file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return this.request<DatasetUploadResponse>({
        method: 'POST',
        url: `/api/projects/${projectId}/dataset/upload`,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },

    getRows: (projectId: string) =>
      this.request<DatasetRow[]>({ method: 'GET', url: `/api/projects/${projectId}/dataset` }),

    updateRow: (projectId: string, rowId: string, data: Partial<DatasetRow>) =>
      this.request<DatasetRow>({
        method: 'PUT',
        url: `/api/projects/${projectId}/dataset/rows/${rowId}`,
        data,
      }),

    deleteRow: (projectId: string, rowId: string) =>
      this.request<{ success: boolean }>({
        method: 'DELETE',
        url: `/api/projects/${projectId}/dataset/rows/${rowId}`,
      }),

    addRow: (projectId: string, data: Omit<DatasetRow, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) =>
      this.request<DatasetRow>({
        method: 'POST',
        url: `/api/projects/${projectId}/dataset/rows`,
        data,
      }),

    autoFormat: (projectId: string) =>
      this.request<{ success: boolean; message: string }>({
        method: 'POST',
        url: `/api/projects/${projectId}/dataset/format`,
      }),
  }

  // ─── Training ─────────────────────────────────────────────
  training = {
    start: (projectId: string, config: TrainingConfig) =>
      this.request<TrainingJob>({
        method: 'POST',
        url: `/api/projects/${projectId}/train`,
        data: config,
      }),

    getJobs: (projectId: string) =>
      this.request<TrainingJob[]>({ method: 'GET', url: `/api/projects/${projectId}/jobs` }),

    getJob: (jobId: string) =>
      this.request<TrainingJob>({ method: 'GET', url: `/api/jobs/${jobId}` }),

    cancelJob: (jobId: string) =>
      this.request<{ success: boolean }>({ method: 'POST', url: `/api/jobs/${jobId}/cancel` }),
  }

  // ─── Evaluation ───────────────────────────────────────────
  evaluation = {
    run: (projectId: string) =>
      this.request<{ jobId: string }>({
        method: 'POST',
        url: `/api/projects/${projectId}/evaluate`,
      }),

    getResults: (projectId: string) =>
      this.request<EvaluationResult>({
        method: 'GET',
        url: `/api/projects/${projectId}/evaluation`,
      }),
  }

  // ─── Export / Deploy ──────────────────────────────────────
  deploy = {
    exportGGUF: (projectId: string, quantization?: string) =>
      this.request<ExportJob>({
        method: 'POST',
        url: `/api/projects/${projectId}/export`,
        data: { quantization },
      }),

    downloadUrl: (projectId: string) =>
      `${API_BASE}/api/projects/${projectId}/export/download`,

    deployOllama: (projectId: string, config: DeployConfig) =>
      this.request<DeployResult>({
        method: 'POST',
        url: `/api/projects/${projectId}/deploy`,
        data: config,
      }),

    pushHuggingFace: (projectId: string, config: DeployConfig) =>
      this.request<DeployResult>({
        method: 'POST',
        url: `/api/projects/${projectId}/deploy`,
        data: { ...config, target: 'huggingface' },
      }),
  }

  // ─── Models ───────────────────────────────────────────────
  models = {
    list: () =>
      this.request<BaseModel[]>({ method: 'GET', url: '/api/models' }),
  }
}

export const api = new ApiClient()

export default api
