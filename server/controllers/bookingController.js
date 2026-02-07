import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const { busId, routeId, tripId, seatNumber, fromStop, toStop, travelDate, amount } = req.body;

        // Check if trip exists and is active
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Check if seat is already booked
        if (trip.bookedSeats.includes(seatNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Seat already booked.'
            });
        }

        // Create booking
        const booking = await Booking.create({
            userId: req.user._id,
            busId,
            routeId,
            tripId,
            seatNumber,
            fromStop,
            toStop,
            travelDate,
            amount,
            ticketId: `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`
        });

        // Update trip's booked seats
        trip.bookedSeats.push(seatNumber);
        await trip.save();

        // Add to user's booking history
        await User.findByIdAndUpdate(req.user._id, {
            $push: { bookingHistory: booking._id }
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('busId', 'busNumber')
            .populate('routeId', 'routeName routeNumber');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully.',
            data: { booking: populatedBooking }
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking.'
        });
    }
};

// Get user's bookings
export const getMyBookings = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { userId: req.user._id };

        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('busId', 'busNumber')
            .populate('routeId', 'routeName routeNumber')
            .sort({ bookingDate: -1 });

        res.json({
            success: true,
            data: { bookings, count: bookings.length }
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings.'
        });
    }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('busId', 'busNumber')
            .populate('routeId', 'routeName routeNumber stops')
            .populate('tripId', 'startTime status');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found.'
            });
        }

        // Verify booking belongs to user (unless admin)
        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied.'
            });
        }

        res.json({
            success: true,
            data: { booking }
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking.'
        });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found.'
            });
        }

        // Verify booking belongs to user
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied.'
            });
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled.'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed booking.'
            });
        }

        // Update booking status
        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        await booking.save();

        // Remove seat from trip's booked seats
        await Trip.findByIdAndUpdate(booking.tripId, {
            $pull: { bookedSeats: booking.seatNumber }
        });

        res.json({
            success: true,
            message: 'Booking cancelled successfully.',
            data: { booking }
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking.'
        });
    }
};

// Get available seats for a trip
export const getAvailableSeats = async (req, res) => {
    try {
        const { tripId } = req.params;

        const trip = await Trip.findById(tripId).populate('busId', 'capacity');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        const totalSeats = trip.busId.capacity;
        const bookedSeats = trip.bookedSeats;
        const availableSeats = [];

        for (let i = 1; i <= totalSeats; i++) {
            if (!bookedSeats.includes(i)) {
                availableSeats.push(i);
            }
        }

        res.json({
            success: true,
            data: {
                totalSeats,
                bookedSeats,
                availableSeats,
                availableCount: availableSeats.length
            }
        });
    } catch (error) {
        console.error('Get available seats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available seats.'
        });
    }
};
