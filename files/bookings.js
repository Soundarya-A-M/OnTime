import express from 'express';
import {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getAvailableSeats
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All booking routes require authentication
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);

// FIX: was /seats/:tripId — client calls /bookings/seats/:tripId so this must match
// Also add authenticate so seat data isn't publicly scraped
router.get('/seats/:tripId', authenticate, getAvailableSeats);

router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, cancelBooking);

export default router;
