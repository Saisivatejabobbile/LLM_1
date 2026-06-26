import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { storage } from '../lib/storage';
import { mlClient } from '../services/mlClient';
import { config } from '../config';

// Use uuid for row IDs since it's already bundled via other deps; fallback to random
function generateRowId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const router = Router({ mergeParams: true });

// Multer setup — store to temp disk first
const upload = multer({
  dest: path.join(config.storage.uploadDir, 'tmp'),
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = config.upload.allowedExtensions;
    if (!allowed.includes(ext as any)) {
      cb(new Error(`File type not allowed. Allowed: ${allowed.join(', ')}`));
      return;
    }
    cb(null, true);
  },
});

const addRowSchema = z.object({
  instruction: z.string().min(1, 'Instruction is required'),
  input: z.string().default(''),
  output: z.string().min(1, 'Output is required'),
});

const updateRowSchema = z.object({
  instruction: z.string().min(1).optional(),
  input: z.string().optional(),
  output: z.string().min(1).optional(),
});

// Helper to get project and verify ownership
async function getAuthorizedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw { statusCode: 404, message: 'Project not found' };
  if (project.userId !== userId) throw { statusCode: 403, message: 'Forbidden' };
  return project;
}

// Parse JSONL content into rows
function parseJsonl(content: string): Array<{ id: string; instruction: string; input: string; output: string }> {
  const lines = content.split('\n').filter((l) => l.trim());
  return lines.map((line, idx) => {
    try {
      const obj = JSON.parse(line);
      return {
        id: obj.id || generateRowId(),
        instruction: obj.instruction || obj.prompt || '',
        input: obj.input || obj.context || '',
        output: obj.output || obj.response || obj.completion || '',
      };
    } catch {
      throw new Error(`Invalid JSON at line ${idx + 1}: ${line.substring(0, 100)}`);
    }
  });
}

// POST /api/projects/:id/dataset/upload
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const savedPath = await storage.saveUpload(req.file, projectId);
    const absPath = storage.getAbsolutePath(savedPath);

    let rows: Array<{ id: string; instruction: string; input: string; output: string }> = [];
    let formatted = false;

    if (ext === '.jsonl' || ext === '.json') {
      // Parse directly
      const content = fs.readFileSync(absPath, 'utf-8');
      if (ext === '.jsonl') {
        rows = parseJsonl(content);
      } else {
        // Try as JSON array
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            rows = parsed.map((item: any) => ({
              id: item.id || generateRowId(),
              instruction: item.instruction || item.prompt || '',
              input: item.input || item.context || '',
              output: item.output || item.response || item.completion || '',
            }));
          } else {
            rows = parseJsonl(content);
          }
        } catch {
          rows = parseJsonl(content);
        }
      }
      formatted = true;
    }
    // For TXT/PDF: save path, will be formatted via /format endpoint

    const dataset = await prisma.dataset.upsert({
      where: { projectId },
      update: {
        filePath: savedPath,
        rows: JSON.stringify(rows),
        formatted,
        rowCount: rows.length,
      },
      create: {
        projectId,
        filePath: savedPath,
        rows: JSON.stringify(rows),
        formatted,
        rowCount: rows.length,
      },
    });

    logger.info(`Dataset uploaded for project ${projectId}: ${rows.length} rows, formatted=${formatted}`);

    res.status(201).json({
      dataset: {
        ...dataset,
        rows,
      },
      message: formatted
        ? `Dataset uploaded with ${rows.length} rows`
        : `File uploaded. Use /format endpoint to extract rows from ${ext} file`,
    });
  } catch (err: any) {
    logger.error('Dataset upload error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    // Clean up temp file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message || 'Failed to upload dataset' });
  }
});

// GET /api/projects/:id/dataset
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const dataset = await prisma.dataset.findUnique({ where: { projectId } });

    if (!dataset) {
      res.status(404).json({ error: 'No dataset found for this project' });
      return;
    }

    const rows = (() => {
      try { return JSON.parse(dataset.rows); } catch { return []; }
    })();

    res.json({
      dataset: {
        ...dataset,
        rows,
      },
    });
  } catch (err: any) {
    logger.error('Get dataset error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// POST /api/projects/:id/dataset/rows — add a new row
router.post('/rows', authenticate, validate(addRowSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    let dataset = await prisma.dataset.findUnique({ where: { projectId } });

    const newRow = {
      id: generateRowId(),
      instruction: req.body.instruction,
      input: req.body.input || '',
      output: req.body.output,
    };

    if (!dataset) {
      dataset = await prisma.dataset.create({
        data: {
          projectId,
          rows: JSON.stringify([newRow]),
          formatted: true,
          rowCount: 1,
        },
      });
    } else {
      const rows: any[] = (() => {
        try { return JSON.parse(dataset.rows); } catch { return []; }
      })();
      rows.push(newRow);
      dataset = await prisma.dataset.update({
        where: { projectId },
        data: {
          rows: JSON.stringify(rows),
          rowCount: rows.length,
        },
      });
    }

    res.status(201).json({ row: newRow });
  } catch (err: any) {
    logger.error('Add dataset row error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to add row' });
  }
});

// PUT /api/projects/:id/dataset/rows/:rowId
router.put('/rows/:rowId', authenticate, validate(updateRowSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId, rowId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const dataset = await prisma.dataset.findUnique({ where: { projectId } });
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    const rows: any[] = (() => {
      try { return JSON.parse(dataset.rows); } catch { return []; }
    })();

    const rowIdx = rows.findIndex((r: any) => r.id === rowId);
    if (rowIdx === -1) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    const updatedRow = {
      ...rows[rowIdx],
      ...(req.body.instruction !== undefined && { instruction: req.body.instruction }),
      ...(req.body.input !== undefined && { input: req.body.input }),
      ...(req.body.output !== undefined && { output: req.body.output }),
    };
    rows[rowIdx] = updatedRow;

    await prisma.dataset.update({
      where: { projectId },
      data: { rows: JSON.stringify(rows) },
    });

    res.json({ row: updatedRow });
  } catch (err: any) {
    logger.error('Update dataset row error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to update row' });
  }
});

// DELETE /api/projects/:id/dataset/rows/:rowId
router.delete('/rows/:rowId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId, rowId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const dataset = await prisma.dataset.findUnique({ where: { projectId } });
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found' });
      return;
    }

    const rows: any[] = (() => {
      try { return JSON.parse(dataset.rows); } catch { return []; }
    })();

    const newRows = rows.filter((r: any) => r.id !== rowId);

    if (newRows.length === rows.length) {
      res.status(404).json({ error: 'Row not found' });
      return;
    }

    await prisma.dataset.update({
      where: { projectId },
      data: {
        rows: JSON.stringify(newRows),
        rowCount: newRows.length,
      },
    });

    res.json({ message: 'Row deleted successfully' });
  } catch (err: any) {
    logger.error('Delete dataset row error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to delete row' });
  }
});

// POST /api/projects/:id/dataset/format
router.post('/format', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { id: projectId } = req.params;

    await getAuthorizedProject(projectId, userId);

    const dataset = await prisma.dataset.findUnique({ where: { projectId } });
    if (!dataset) {
      res.status(404).json({ error: 'No dataset found. Upload a file first.' });
      return;
    }

    if (!dataset.filePath) {
      res.status(400).json({ error: 'No file path associated with dataset' });
      return;
    }

    const absFilePath = storage.getAbsolutePath(dataset.filePath);

    // Call ML worker to format the dataset
    const result = await mlClient.formatDataset(absFilePath, projectId);

    const formattedRows = result.rows.map((r: any) => ({
      id: r.id || generateRowId(),
      instruction: r.instruction || '',
      input: r.input || '',
      output: r.output || '',
    }));

    const updatedDataset = await prisma.dataset.update({
      where: { projectId },
      data: {
        rows: JSON.stringify(formattedRows),
        formatted: true,
        rowCount: formattedRows.length,
      },
    });

    logger.info(`Dataset formatted for project ${projectId}: ${formattedRows.length} rows`);

    res.json({
      dataset: {
        ...updatedDataset,
        rows: formattedRows,
      },
    });
  } catch (err: any) {
    logger.error('Format dataset error:', err);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to format dataset' });
  }
});

export default router;
