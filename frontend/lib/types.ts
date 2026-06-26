// ============================================================
// SLM Forge — All TypeScript interfaces & types
// ============================================================

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export type ProjectStatus = 'draft' | 'training' | 'completed' | 'failed' | 'deployed'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  baseModelId: string
  baseModel?: BaseModel
  userId: string
  datasetRowCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectPayload {
  name: string
  description: string
  baseModelId: string
}

export interface BaseModel {
  id: string
  name: string
  hfModelId: string
  description: string
  maxVram: number
  paramCount: string
  isQuantizable: boolean
}

export interface DatasetRow {
  id: string
  projectId: string
  instruction: string
  input?: string
  output: string
  rowIndex: number
  createdAt: string
  updatedAt: string
}

export interface DatasetUploadResponse {
  rowsImported: number
  totalRows: number
  message: string
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface TrainingJob {
  id: string
  projectId: string
  type: 'training' | 'export' | 'evaluation' | 'deploy'
  status: JobStatus
  config: TrainingConfig
  progress: number
  currentEpoch: number
  totalEpochs: number
  currentStep: number
  totalSteps: number
  loss?: number
  evalLoss?: number
  metrics?: string | any
  errorMessage?: string
  logs: string[]
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TrainingConfig {
  epochs: number
  learningRate: number
  loraRank: number
  loraAlpha: number
  loraDropout: number
  batchSize: number
  warmupSteps: number
  maxSeqLength: number
  useQLoRA: boolean
  gradientAccumulationSteps?: number
  weightDecay?: number
  fp16?: boolean
  bf16?: boolean
  savingStrategy?: 'epoch' | 'steps'
  evaluationStrategy?: 'epoch' | 'steps' | 'no'
}

export interface TrainingProgressEvent {
  jobId: string
  progress: number
  loss: number
  evalLoss: number
  epoch: number
  step: number
  totalSteps: number
}

export interface LossDataPoint {
  step: number
  epoch: number
  loss: number
  evalLoss?: number
}

export interface EvaluationResult {
  id: string
  projectId: string
  jobId?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  bleuScore?: number
  rougeL?: number
  rouge1?: number
  rouge2?: number
  perplexity?: number
  comparisons: EvaluationComparison[]
  createdAt: string
  updatedAt: string
}

export interface EvaluationComparison {
  id: string
  prompt: string
  baseModelOutput: string
  fineTunedOutput: string
  bleuBase?: number
  bleuFineTuned?: number
  rougeLBase?: number
  rougeLFineTuned?: number
}

export interface ExportJob {
  id: string
  projectId: string
  status: JobStatus
  format: 'gguf' | 'hf'
  downloadUrl?: string
  fileSize?: number
  quantization?: string
  createdAt: string
  updatedAt: string
}

export interface DeployConfig {
  target: 'ollama' | 'huggingface'
  modelName?: string
  hfRepoId?: string
  hfToken?: string
  quantization?: 'q4_k_m' | 'q8_0' | 'q5_k_m' | 'fp16'
}

export interface DeployResult {
  success: boolean
  message: string
  modelName?: string
  pullCommand?: string
  hfUrl?: string
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface StatsOverview {
  totalProjects: number
  runningJobs: number
  completedJobs: number
  totalDatasetRows: number
  deployedModels: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'project_created' | 'training_started' | 'training_completed' | 'model_deployed'
  message: string
  projectId?: string
  projectName?: string
  createdAt: string
}

export interface HardwareInfo {
  gpuName?: string
  totalVram?: number
  availableVram?: number
  isCudaAvailable: boolean
  computeCapability?: string
}

// WebSocket event types
export interface SocketJobProgress {
  jobId: string
  progress: number
  loss: number
  evalLoss: number
  epoch: number
  step: number
  totalSteps: number
}

export interface SocketJobComplete {
  jobId: string
  status: JobStatus
}

export interface SocketJobError {
  jobId: string
  error: string
}

export interface SocketExportReady {
  jobId: string
  downloadUrl: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  name: string
}

export interface ProjectFormData {
  name: string
  description: string
  baseModelId: string
}

export interface TrainingFormData extends TrainingConfig {}

export interface DeployFormData extends DeployConfig {}
