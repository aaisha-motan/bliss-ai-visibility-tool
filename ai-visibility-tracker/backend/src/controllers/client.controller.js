import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { generatePrompts as generatePromptsService, validatePrompts } from '../services/promptGenerator.js';
import { discoverKeywords as discoverKeywordsService } from '../services/keywordDiscovery.js';
import { processBulkUpload, validateCSV, generateCSVTemplate } from '../services/bulkUpload.js';
import { getDecryptedSettings } from './settings.controller.js';

export async function listClients(req, res, next) {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            reports: true,
            scans: true,
          },
        },
      },
    });

    res.json({ clients });
  } catch (error) {
    next(error);
  }
}

export async function createClient(req, res, next) {
  try {
    const { name, domain, industry, location, logoUrl, competitors, prompts } = req.body;

    if (!name || !domain) {
      throw new AppError('Name and domain are required', 400, 'VALIDATION_ERROR');
    }

    const client = await prisma.client.create({
      data: {
        userId: req.user.id,
        name,
        domain,
        industry: industry || null,
        location: location || null,
        logoUrl: logoUrl || null,
        competitors: competitors || [],
        prompts: prompts || [],
      },
    });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
}

export async function getClient(req, res, next) {
  try {
    const { id } = req.params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            overallScore: true,
            createdAt: true,
            featuredCount: true,
            mentionedCount: true,
            notFoundCount: true,
          },
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            progress: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, domain, industry, location, logoUrl, competitors, prompts } = req.body;

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(domain && { domain }),
        ...(industry !== undefined && { industry }),
        ...(location !== undefined && { location }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(competitors !== undefined && { competitors }),
        ...(prompts !== undefined && { prompts }),
      },
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function addPrompts(req, res, next) {
  try {
    const { id } = req.params;
    const { prompts } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      throw new AppError('Prompts array is required', 400, 'VALIDATION_ERROR');
    }

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        prompts: {
          push: prompts,
        },
      },
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

export async function removePrompt(req, res, next) {
  try {
    const { id, index } = req.params;
    const promptIndex = parseInt(index, 10);

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    if (promptIndex < 0 || promptIndex >= existing.prompts.length) {
      throw new AppError('Invalid prompt index', 400, 'VALIDATION_ERROR');
    }

    const newPrompts = existing.prompts.filter((_, i) => i !== promptIndex);

    const client = await prisma.client.update({
      where: { id },
      data: { prompts: newPrompts },
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

export async function addCompetitors(req, res, next) {
  try {
    const { id } = req.params;
    const { competitors } = req.body;

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      throw new AppError('Competitors array is required', 400, 'VALIDATION_ERROR');
    }

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        competitors: {
          push: competitors,
        },
      },
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

export async function removeCompetitor(req, res, next) {
  try {
    const { id, index } = req.params;
    const competitorIndex = parseInt(index, 10);

    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    if (competitorIndex < 0 || competitorIndex >= existing.competitors.length) {
      throw new AppError('Invalid competitor index', 400, 'VALIDATION_ERROR');
    }

    const newCompetitors = existing.competitors.filter((_, i) => i !== competitorIndex);

    const client = await prisma.client.update({
      where: { id },
      data: { competitors: newCompetitors },
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate AI search prompts from keywords
 * NEW FUNCTION - Added February 12, 2026
 * Updated: February 18, 2026 - Added ChatGPT browser support
 * Addresses Rich's request for auto-generating prompts
 */
export async function generatePrompts(req, res, next) {
  try {
    const { id } = req.params;
    const { keywords, location, count = 10 } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      throw new AppError('Keywords array is required', 400, 'VALIDATION_ERROR');
    }

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    // Get user settings (for ChatGPT session token)
    const settings = await getDecryptedSettings(req.user.id);

    // Generate prompts using ChatGPT browser, AI API, or templates
    const result = await generatePromptsService({
      brandName: client.name,
      domain: client.domain,
      keywords,
      industry: client.industry || '',
      location: location || client.location || '',
      count: Math.min(count, 50), // Cap at 50 prompts
    }, settings); // Pass settings with session token

    // Validate and clean the prompts
    const validatedPrompts = validatePrompts(result.prompts, client.name);

    res.json({
      prompts: validatedPrompts,
      source: result.source,
      metadata: {
        ...result.metadata,
        clientId: client.id,
        clientName: client.name,
        generatedCount: validatedPrompts.length,
        requestedCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Discover keywords/prompts where client is already ranking
 * NEW FUNCTION - Added February 17, 2026
 * Addresses Rich's request: "How do we find keywords that we're ranking well for?"
 */
export async function discoverKeywords(req, res, next) {
  try {
    const { id } = req.params;
    const { industry, services, location, depth = 'standard', engine = 'chatgpt' } = req.body;

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    // Use client's industry/location if not provided
    const discoveryIndustry = industry || client.industry;
    if (!discoveryIndustry) {
      throw new AppError('Industry is required. Please set it on the client or provide it in the request.', 400, 'VALIDATION_ERROR');
    }

    // Run discovery
    const result = await discoverKeywordsService({
      clientId: client.id,
      clientName: client.name,
      clientDomain: client.domain,
      userId: req.user.id,
      industry: discoveryIndustry,
      services: services || [],
      location: location || client.location || '',
      depth,
      engine,
      onProgress: (progress, message) => {
        // For now, just log progress. Could be extended to SSE/WebSocket later.
        console.log(`Discovery progress: ${progress}% - ${message}`);
      },
    });

    res.json({
      success: true,
      clientId: client.id,
      clientName: client.name,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Bulk upload prompts from CSV
 * NEW FUNCTION - Added February 17, 2026
 * Addresses Rich request: "Upload 100 prompts"
 */
export async function bulkUploadPrompts(req, res, next) {
  try {
    const { id } = req.params;
    const { csvContent, skipDuplicates = true } = req.body;

    if (!csvContent) {
      throw new AppError("CSV content is required", 400, "VALIDATION_ERROR");
    }

    const client = await prisma.client.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!client) {
      throw new AppError("Client not found", 404, "NOT_FOUND");
    }

    const result = await processBulkUpload(id, req.user.id, csvContent, { skipDuplicates });

    res.json({
      success: result.success,
      clientId: client.id,
      clientName: client.name,
      added: result.added,
      duplicates: result.duplicates,
      total: result.total,
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get CSV template for bulk upload
 */
export async function getCSVTemplate(req, res) {
  const template = generateCSVTemplate();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=prompts_template.csv");
  res.send(template);
}

/**
 * Validate CSV content before upload
 */
export async function validateBulkCSV(req, res, next) {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      throw new AppError("CSV content is required", 400, "VALIDATION_ERROR");
    }
    const result = validateCSV(csvContent);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
