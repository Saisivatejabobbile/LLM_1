import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../lib/logger';

export interface TrainRequest {
  jobId: string;
  projectId: string;
  datasetPath: string;
  baseModelId: string;
  hfModelId: string;
  outputDir: string;
  config: {
    epochs: number;
    learningRate: number;
    loraRank: number;
    loraAlpha: number;
    loraDropout: number;
    batchSize: number;
    warmupSteps: number;
    maxSeqLength: number;
    useQLoRA: boolean;
  };
  callbackUrl: string;
  targetModules: string[];
}

export interface ExportRequest {
  jobId: string;
  projectId: string;
  adapterPath: string;
  outputDir: string;
}

export interface EvaluateRequest {
  jobId: string;
  projectId: string;
  datasetPath: string;
  baseModelId: string;
  hfModelId: string;
  adapterPath: string | null;
}

export interface DeployRequest {
  jobId: string;
  projectId: string;
  ggufPath: string;
  modelName: string;
}

export interface EvaluationResult {
  bleuScore: number;
  rougeL: number;
  rouge1: number;
  rouge2: number;
  comparisons: Array<{
    instruction: string;
    input: string;
    reference: string;
    baseOutput: string;
    finetunedOutput: string;
    bleu: number;
    rougeL: number;
  }>;
}

class MLClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.mlWorker.url,
      timeout: 30 * 60 * 1000, // 30 minutes for long-running ML tasks
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'api',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((axiosConfig) => {
      logger.debug(`ML Worker request: ${axiosConfig.method?.toUpperCase()} ${axiosConfig.url}`);
      return axiosConfig;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`ML Worker response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status;
        const data = error.response?.data;
        logger.error(`ML Worker error: ${status} ${error.config?.url}`, data);
        return Promise.reject(error);
      }
    );
  }

  async train(payload: TrainRequest): Promise<{ taskId?: string; status: string }> {
    try {
      const response = await this.client.post('/train', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'ML Worker train failed';
      throw new Error(message);
    }
  }

  async export(payload: ExportRequest): Promise<{ ggufPath: string; status: string }> {
    try {
      const response = await this.client.post('/export', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'ML Worker export failed';
      throw new Error(message);
    }
  }

  async evaluate(payload: EvaluateRequest): Promise<EvaluationResult> {
    try {
      const response = await this.client.post('/evaluate', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'ML Worker evaluate failed';
      throw new Error(message);
    }
  }

  async deploy(payload: DeployRequest): Promise<{ endpoint?: string; status: string }> {
    try {
      const response = await this.client.post('/deploy', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'ML Worker deploy failed';
      throw new Error(message);
    }
  }

  async formatDataset(filePath: string, projectId: string): Promise<{ rows: Array<{ instruction: string; input: string; output: string }> }> {
    try {
      const response = await this.client.post('/format-dataset', { filePath, projectId });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'ML Worker format failed';
      throw new Error(message);
    }
  }

  async getHealth(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.data;
    } catch {
      return { status: 'unavailable' };
    }
  }
}

export const mlClient = new MLClient();
