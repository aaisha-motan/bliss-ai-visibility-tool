import crypto from 'crypto';
import prisma from '../config/database.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { validateAllTokens, getTokenStatus } from '../services/tokenValidator.js';

// Encryption helpers
function encrypt(text) {
  if (!text) return null;
  if (!config.encryptionKey || !config.encryptionIv) {
    throw new AppError('Encryption not configured', 500, 'CONFIG_ERROR');
  }

  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(config.encryptionIv, 'hex');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted) {
  if (!encrypted) return null;
  if (!config.encryptionKey || !config.encryptionIv) {
    throw new AppError('Encryption not configured', 500, 'CONFIG_ERROR');
  }

  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(config.encryptionIv, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function getSettings(req, res, next) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user.id,
          theme: 'dark',
        },
      });
    }

    // Return settings with masked sensitive data
    res.json({
      settings: {
        id: settings.id,
        theme: settings.theme,
        hasSerpApiKey: !!settings.serpApiKey,
        hasChatgptSession: !!settings.chatgptSessionToken,
        hasPerplexitySession: !!settings.perplexitySessionToken,
        hasFirecrawlApiKey: !!settings.firecrawlApiKey,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { theme, serpApiKey, chatgptSessionToken, perplexitySessionToken, firecrawlApiKey } = req.body;

    // Build update data
    const updateData = {};

    if (theme !== undefined) {
      if (!['dark', 'light'].includes(theme)) {
        throw new AppError('Invalid theme value', 400, 'VALIDATION_ERROR');
      }
      updateData.theme = theme;
    }

    if (serpApiKey !== undefined) {
      updateData.serpApiKey = serpApiKey ? encrypt(serpApiKey) : null;
    }

    if (chatgptSessionToken !== undefined) {
      updateData.chatgptSessionToken = chatgptSessionToken ? encrypt(chatgptSessionToken) : null;
    }

    if (perplexitySessionToken !== undefined) {
      updateData.perplexitySessionToken = perplexitySessionToken ? encrypt(perplexitySessionToken) : null;
    }

    if (firecrawlApiKey !== undefined) {
      updateData.firecrawlApiKey = firecrawlApiKey ? encrypt(firecrawlApiKey) : null;
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: updateData,
      create: {
        userId: req.user.id,
        theme: theme || 'dark',
        serpApiKey: serpApiKey ? encrypt(serpApiKey) : null,
        chatgptSessionToken: chatgptSessionToken ? encrypt(chatgptSessionToken) : null,
        perplexitySessionToken: perplexitySessionToken ? encrypt(perplexitySessionToken) : null,
        firecrawlApiKey: firecrawlApiKey ? encrypt(firecrawlApiKey) : null,
      },
    });

    res.json({
      message: 'Settings updated successfully',
      settings: {
        id: settings.id,
        theme: settings.theme,
        hasSerpApiKey: !!settings.serpApiKey,
        hasChatgptSession: !!settings.chatgptSessionToken,
        hasPerplexitySession: !!settings.perplexitySessionToken,
        hasFirecrawlApiKey: !!settings.firecrawlApiKey,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Helper to get decrypted API keys (used internally by scan services)
export async function getDecryptedSettings(userId) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return null;
  }

  return {
    theme: settings.theme,
    serpApiKey: settings.serpApiKey ? decrypt(settings.serpApiKey) : null,
    chatgptSessionToken: settings.chatgptSessionToken ? decrypt(settings.chatgptSessionToken) : null,
    perplexitySessionToken: settings.perplexitySessionToken ? decrypt(settings.perplexitySessionToken) : null,
    firecrawlApiKey: settings.firecrawlApiKey ? decrypt(settings.firecrawlApiKey) : null,
  };
}

/**
 * Validate all session tokens for the current user
 * This performs actual browser validation - may take 30-60 seconds
 */
export async function validateTokens(req, res, next) {
  try {
    const results = await validateAllTokens(req.user.id);

    res.json({
      message: 'Token validation complete',
      validation: results,
      validatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get quick token status without browser validation
 * Returns cached validation status from database
 */
export async function checkTokenStatus(req, res, next) {
  try {
    const status = await getTokenStatus(req.user.id);

    // Determine if any tokens need attention
    const needsAttention = [];

    if (status.chatgpt.configured && status.chatgpt.valid === false) {
      needsAttention.push({
        engine: 'ChatGPT',
        message: 'Session token expired or invalid',
        lastValidation: status.chatgpt.lastValidation,
      });
    }

    if (status.perplexity.configured && status.perplexity.valid === false) {
      needsAttention.push({
        engine: 'Perplexity',
        message: 'Session token expired or invalid',
        lastValidation: status.perplexity.lastValidation,
      });
    }

    res.json({
      status,
      needsAttention,
      hasIssues: needsAttention.length > 0,
    });
  } catch (error) {
    next(error);
  }
}
