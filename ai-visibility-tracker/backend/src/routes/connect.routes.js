import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as sessionCapture from '../services/sessionCapture.js';
import { getDecryptedSettings } from '../controllers/settings.controller.js';
import prisma from '../config/database.js';
import crypto from 'crypto';
import config from '../config/env.js';

const router = Router();

router.use(authenticate);

// Encrypt helper
function encrypt(text) {
  if (!text) return null;
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = Buffer.from(config.encryptionIv, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Start login session
router.post('/start/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;

    if (!['chatgpt', 'perplexity'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform. Use "chatgpt" or "perplexity"' });
    }

    const result = await sessionCapture.startLoginSession(req.user.id, platform);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Check login status
router.get('/status/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await sessionCapture.checkLoginStatus(req.user.id, platform);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Complete login and save session
router.post('/complete/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await sessionCapture.completeLogin(req.user.id, platform);

    if (result.success && result.sessionToken) {
      // Save encrypted token to database
      const updateData = {};

      if (platform === 'chatgpt') {
        updateData.chatgptSessionToken = encrypt(result.sessionToken);
      } else if (platform === 'perplexity') {
        updateData.perplexitySessionToken = encrypt(result.sessionToken);
      }

      await prisma.userSettings.upsert({
        where: { userId: req.user.id },
        update: updateData,
        create: {
          userId: req.user.id,
          ...updateData,
        },
      });
    }

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

// Cancel login session
router.post('/cancel/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const result = await sessionCapture.closeLoginSession(req.user.id, platform);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get connection status for all platforms
router.get('/status', async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    res.json({
      chatgpt: {
        connected: !!settings?.chatgptSessionToken,
      },
      perplexity: {
        connected: !!settings?.perplexitySessionToken,
      },
      google: {
        connected: !!settings?.serpApiKey,
      },
      activeSessions: sessionCapture.getActiveSessions(req.user.id),
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect a platform
router.post('/disconnect/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const updateData = {};

    if (platform === 'chatgpt') {
      updateData.chatgptSessionToken = null;
    } else if (platform === 'perplexity') {
      updateData.perplexitySessionToken = null;
    } else if (platform === 'google') {
      updateData.serpApiKey = null;
    }

    await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: updateData,
    });

    res.json({ success: true, message: `${platform} disconnected` });
  } catch (error) {
    next(error);
  }
});

export default router;
