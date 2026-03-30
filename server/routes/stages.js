import express from 'express';
import {
    createStage,
    getStagesByRoute,
    updateStage,
    deleteStage,
    getUniqueStages
} from '../controllers/stageController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Public - anyone can view stages globally or for a route
router.get('/unique', getUniqueStages);
router.get('/:routeId', getStagesByRoute);

// Admin-only
router.post('/', authenticate, requireAdmin, createStage);
router.put('/:id', authenticate, requireAdmin, updateStage);
router.delete('/:id', authenticate, requireAdmin, deleteStage);

export default router;
