import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from './logger';

export interface StorageService {
  saveUpload(file: Express.Multer.File, projectId: string): Promise<string>;
  saveModel(projectId: string, filename: string): Promise<string>;
  getAbsolutePath(relativePath: string): string;
  exists(relativePath: string): boolean;
  deleteFile(relativePath: string): Promise<void>;
  ensureDir(dirPath: string): Promise<void>;
}

class LocalStorageService implements StorageService {
  private uploadDir: string;
  private modelsDir: string;

  constructor() {
    this.uploadDir = config.storage.uploadDir;
    this.modelsDir = config.storage.modelsDir;
    this.initDirs();
  }

  private initDirs(): void {
    const dirs = [
      this.uploadDir,
      this.modelsDir,
      path.join(this.uploadDir, 'tmp'),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    }
  }

  async saveUpload(file: Express.Multer.File, projectId: string): Promise<string> {
    const projectUploadDir = path.join(this.uploadDir, projectId);
    await this.ensureDir(projectUploadDir);

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `dataset_${timestamp}${ext}`;
    const destPath = path.join(projectUploadDir, filename);

    // Move from temp multer location to final destination
    await fs.promises.rename(file.path, destPath);

    const relativePath = path.join('uploads', projectId, filename);
    logger.info(`Saved upload to: ${relativePath}`);
    return relativePath;
  }

  async saveModel(projectId: string, filename: string): Promise<string> {
    const projectModelDir = path.join(this.modelsDir, projectId);
    await this.ensureDir(projectModelDir);
    const relativePath = path.join('models', projectId, filename);
    return relativePath;
  }

  getAbsolutePath(relativePath: string): string {
    // Handle both absolute paths and relative paths
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    // Relative paths: strip leading 'uploads/' or 'models/' prefix and use configured dirs
    if (relativePath.startsWith('uploads/') || relativePath.startsWith('uploads\\')) {
      const subPath = relativePath.replace(/^uploads[/\\]/, '');
      return path.join(config.storage.uploadDir, subPath);
    }
    if (relativePath.startsWith('models/') || relativePath.startsWith('models\\')) {
      const subPath = relativePath.replace(/^models[/\\]/, '');
      return path.join(config.storage.modelsDir, subPath);
    }
    // Fallback: join with upload dir
    return path.join(config.storage.uploadDir, relativePath);
  }

  exists(relativePath: string): boolean {
    const absPath = this.getAbsolutePath(relativePath);
    return fs.existsSync(absPath);
  }

  async deleteFile(relativePath: string): Promise<void> {
    const absPath = this.getAbsolutePath(relativePath);
    if (fs.existsSync(absPath)) {
      await fs.promises.unlink(absPath);
      logger.info(`Deleted file: ${relativePath}`);
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }
}

export const storage = new LocalStorageService();
