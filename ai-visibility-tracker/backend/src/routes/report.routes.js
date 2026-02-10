import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Report endpoints
router.get('/', reportController.listReports);
router.get('/:id', reportController.getReport);
router.delete('/:id', reportController.deleteReport);
router.get('/:id/pdf', reportController.generatePdf);

export default router;
