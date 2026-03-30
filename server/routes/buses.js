import express from 'express';
import {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    assignDriver,
    updateLocation,
    searchBuses
} from '../controllers/busController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireDriver } from '../middleware/roleCheck.js';

const router = express.Router();

// Public routes - anyone can view buses
router.get('/search', searchBuses);
router.get('/', getAllBuses);
router.get('/:id', getBusById);

// Admin-only routes
router.post('/', authenticate, requireAdmin, createBus);
router.put('/:id', authenticate, requireAdmin, updateBus);
router.put('/:id/driver', authenticate, requireAdmin, assignDriver);

// Driver-only route
router.put('/:id/location', authenticate, requireDriver, updateLocation);

export default router;
