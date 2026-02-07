import express from 'express';
import {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute
} from '../controllers/routeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Public route - anyone can view routes
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, createRoute);
router.put('/:id', authenticate, requireAdmin, updateRoute);
router.delete('/:id', authenticate, requireAdmin, deleteRoute);

export default router;
