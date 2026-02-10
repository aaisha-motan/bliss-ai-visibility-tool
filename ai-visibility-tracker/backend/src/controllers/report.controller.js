import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listReports(req, res, next) {
  try {
    const { clientId, limit = 50, offset = 0 } = req.query;

    const where = {
      client: { userId: req.user.id },
      ...(clientId && { clientId }),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
        include: {
          client: {
            select: { id: true, name: true, domain: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReport(req, res, next) {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: {
        id,
        client: { userId: req.user.id },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            location: true,
            competitors: true,
          },
        },
        promptResults: {
          include: {
            engineResults: {
              orderBy: { engine: 'asc' },
            },
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    // Calculate engine statistics
    const engineStats = {
      CHATGPT: { featured: 0, mentioned: 0, competitorOnly: 0, notFound: 0 },
      PERPLEXITY: { featured: 0, mentioned: 0, competitorOnly: 0, notFound: 0 },
      GOOGLE_AIO: { featured: 0, mentioned: 0, competitorOnly: 0, notFound: 0 },
    };

    const competitorFrequency = {};

    for (const promptResult of report.promptResults) {
      for (const engineResult of promptResult.engineResults) {
        const engine = engineResult.engine;
        const mentionType = engineResult.mentionType;

        if (mentionType === 'FEATURED') engineStats[engine].featured++;
        else if (mentionType === 'MENTIONED') engineStats[engine].mentioned++;
        else if (mentionType === 'COMPETITOR_ONLY') engineStats[engine].competitorOnly++;
        else if (mentionType === 'NOT_FOUND') engineStats[engine].notFound++;

        // Track competitor mentions
        for (const competitor of engineResult.competitorsMentioned) {
          competitorFrequency[competitor] = (competitorFrequency[competitor] || 0) + 1;
        }
      }
    }

    // Convert competitor frequency to sorted array
    const competitorData = Object.entries(competitorFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      report: {
        ...report,
        engineStats,
        competitorData,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReport(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.report.findFirst({
      where: {
        id,
        client: { userId: req.user.id },
      },
    });

    if (!existing) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    await prisma.report.delete({
      where: { id },
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function generatePdf(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership and get report
    const report = await prisma.report.findFirst({
      where: {
        id,
        client: { userId: req.user.id },
      },
      include: {
        client: true,
        promptResults: {
          include: {
            engineResults: true,
          },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    // For now, return JSON data that the frontend can use to generate PDF
    // Server-side PDF generation can be added later using puppeteer
    res.json({
      message: 'PDF generation data',
      report: {
        id: report.id,
        clientName: report.client.name,
        clientDomain: report.client.domain,
        overallScore: report.overallScore,
        createdAt: report.createdAt,
        summary: {
          featured: report.featuredCount,
          mentioned: report.mentionedCount,
          competitorOnly: report.competitorOnlyCount,
          notFound: report.notFoundCount,
          bestEngine: report.bestEngine,
          worstEngine: report.worstEngine,
          newCompetitors: report.newCompetitorsDetected,
        },
        promptCount: report.promptCount,
      },
    });
  } catch (error) {
    next(error);
  }
}
