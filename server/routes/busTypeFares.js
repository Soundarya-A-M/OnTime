import express from 'express';
import {
    getAllBusTypeFares,
    createBusTypeFare,
    updateBusTypeFare
} from '../controllers/busTypeFareController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Public - anyone can view bus type fares
router.get('/', getAllBusTypeFares);

// Admin-only
router.post('/', authenticate, requireAdmin, createBusTypeFare);
router.put('/:id', authenticate, requireAdmin, updateBusTypeFare);

export default router;
