import express from 'express';
import {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getAvailableSeats,
    getTripReservations
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { requireDriver } from '../middleware/roleCheck.js';

const router = express.Router();

// All booking routes require authentication
router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getMyBookings);

// Available seats for a trip (used by BookTicket seat picker)
router.get('/seats/:tripId', authenticate, getAvailableSeats);

// All reservations for a trip — driver or admin only (used by Driver Dashboard Reserved tab)
router.get('/trip/:tripId/reserved', authenticate, requireDriver, getTripReservations);

router.get('/:id', authenticate, getBookingById);
router.put('/:id/cancel', authenticate, cancelBooking);

export default router;
