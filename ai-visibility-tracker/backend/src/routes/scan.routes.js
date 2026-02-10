import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { scanLimiter } from '../middleware/rateLimiter.js';
import * as scanController from '../controllers/scan.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Scan endpoints
router.post('/', scanLimiter, scanController.startScan);
router.get('/:id', scanController.getScan);
router.get('/:id/status', scanController.getScanStatus);

export default router;
