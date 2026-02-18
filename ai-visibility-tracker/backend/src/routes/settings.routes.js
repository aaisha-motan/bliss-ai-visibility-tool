import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as settingsController from '../controllers/settings.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Settings endpoints
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Token validation endpoints
router.get('/tokens/status', settingsController.checkTokenStatus);  // Quick status check
router.post('/tokens/validate', settingsController.validateTokens); // Full browser validation

export default router;
