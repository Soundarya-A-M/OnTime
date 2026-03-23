import express from 'express';
import {
    startTrip,
    endTrip,
    getActiveTrips,
    getTripHistory,
    getMyCurrentTrip
} from '../controllers/tripController.js';
import { reportDelay, getDelay } from '../controllers/notificationController.js';
import { advanceStage, issueETMTicket, getCurrentStage } from '../controllers/etmController.js';
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

// ETM routes
router.post('/:id/advance-stage', authenticate, requireDriver, advanceStage);
router.post('/:id/etm-ticket', authenticate, requireDriver, issueETMTicket);
router.get('/:id/current-stage', getCurrentStage);

// Admin routes
router.get('/history', authenticate, requireAdmin, getTripHistory);

export default router;

