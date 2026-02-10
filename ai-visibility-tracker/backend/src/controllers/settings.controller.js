import crypto from 'crypto';
import prisma from '../config/database.js';
import config from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

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
