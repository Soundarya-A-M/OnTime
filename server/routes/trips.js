import express from 'express';
import {
    startTrip,
    endTrip,
    getActiveTrips,
    getTripHistory,
    getMyCurrentTrip
} from '../controllers/tripController.js';
import { reportDelay, getDelay } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireDriver, requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Public route - anyone can view active trips
router.get('/active', getActiveTrips);

// Driver routes
router.post('/start', authenticate, requireDriver, startTrip);
router.put('/:id/end', authenticate, requireDriver, endTrip);
router.get('/my-current', authenticate, requireDriver, getMyCurrentTrip);
router.post('/:id/delay', authenticate, requireDriver, reportDelay);
router.get('/:id/delay', authenticate, getDelay);

// Admin routes
router.get('/history', authenticate, requireAdmin, getTripHistory);

export default router;
