import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as clientController from '../controllers/client.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client CRUD
router.get('/', clientController.listClients);
router.post('/', clientController.createClient);
router.get('/:id', clientController.getClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// Prompt management
router.post('/:id/prompts', clientController.addPrompts);
router.delete('/:id/prompts/:index', clientController.removePrompt);

// Competitor management
router.post('/:id/competitors', clientController.addCompetitors);
router.delete('/:id/competitors/:index', clientController.removeCompetitor);

export default router;
