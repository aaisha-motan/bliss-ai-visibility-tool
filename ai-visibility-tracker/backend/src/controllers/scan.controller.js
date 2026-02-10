import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { addScanJob } from '../jobs/queue.js';

export async function startScan(req, res, next) {
  try {
    const { clientId, prompts } = req.body;

    if (!clientId) {
      throw new AppError('Client ID is required', 400, 'VALIDATION_ERROR');
    }

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: req.user.id },
    });

    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    // Use provided prompts or fall back to client's stored prompts
    const promptsToScan = prompts && prompts.length > 0 ? prompts : client.prompts;

    if (!promptsToScan || promptsToScan.length === 0) {
      throw new AppError('No prompts to scan. Add prompts to the client first.', 400, 'VALIDATION_ERROR');
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        clientId,
        status: 'QUEUED',
        progress: 0,
        currentStep: 'Queued for processing',
      },
    });

    // Add job to queue
    await addScanJob({
      scanId: scan.id,
      clientId,
      userId: req.user.id,
      prompts: promptsToScan,
    });

    res.status(201).json({
      message: 'Scan started',
      scan: {
        id: scan.id,
        status: scan.status,
        progress: scan.progress,
        currentStep: scan.currentStep,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getScan(req, res, next) {
  try {
    const { id } = req.params;

    const scan = await prisma.scan.findFirst({
      where: {
        id,
        client: { userId: req.user.id },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        report: {
          select: { id: true, overallScore: true },
        },
      },
    });

    if (!scan) {
      throw new AppError('Scan not found', 404, 'NOT_FOUND');
    }

    res.json({ scan });
  } catch (error) {
    next(error);
  }
}

export async function getScanStatus(req, res, next) {
  try {
    const { id } = req.params;

    const scan = await prisma.scan.findFirst({
      where: {
        id,
        client: { userId: req.user.id },
      },
      select: {
        id: true,
        status: true,
        progress: true,
        currentStep: true,
        error: true,
        startedAt: true,
        completedAt: true,
        report: {
          select: { id: true },
        },
      },
    });

    if (!scan) {
      throw new AppError('Scan not found', 404, 'NOT_FOUND');
    }

    res.json({
      id: scan.id,
      status: scan.status,
      progress: scan.progress,
      currentStep: scan.currentStep,
      error: scan.error,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      reportId: scan.report?.id,
    });
  } catch (error) {
    next(error);
  }
}
