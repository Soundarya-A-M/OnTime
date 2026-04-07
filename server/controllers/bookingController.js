import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const {
            busId, routeId, tripId,
            seatNumber, seatNumbers,      // support both single and array
            fromStop, toStop,
            travelDate, amount,
            passengerDetails
        } = req.body;

        // Normalise seat list — accept seatNumbers[] or legacy seatNumber
        const seats = seatNumbers && seatNumbers.length > 0
            ? seatNumbers
            : seatNumber ? [seatNumber] : [];

        if (seats.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one seat number is required.' });
        }

        // If a tripId was provided, validate it and check seat availability
        if (tripId) {
            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ success: false, message: 'Trip not found.' });
            }
            const alreadyBooked = seats.filter(s => trip.bookedSeats.includes(s));
            if (alreadyBooked.length > 0) {
                return res.status(400).json({ success: false, message: `Seats already booked: ${alreadyBooked.join(', ')}` });
            }
            // Update trip's booked seats
            trip.bookedSeats.push(...seats);
            await trip.save();
        }

        // Generate a unique ticket ID
        const ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

        // Create one booking record covering all seats
        const booking = await Booking.create({
            userId: req.user._id,
            busId,
            routeId,
            tripId: tripId || undefined,
            seatNumber: seats[0],         // keep legacy field pointing to first seat
            seatNumbers: seats,
            fromStop: fromStop || '',
            toStop: toStop || '',
            travelDate,
            amount,
            passengerDetails: passengerDetails || {},
            ticketId,
        });

        // Add to user's booking history
        await User.findByIdAndUpdate(req.user._id, {
            $push: { bookingHistory: booking._id }
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('busId', 'busNumber busType')
            .populate('routeId', 'routeName routeNumber');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully.',
            data: { booking: populatedBooking }
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to create booking.' });
    }
};

// Get user's bookings
export const getMyBookings = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { userId: req.user._id };
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('busId', 'busNumber busType')
            .populate('routeId', 'routeName routeNumber')
            .sort({ bookingDate: -1 });

        res.json({ success: true, data: { bookings, count: bookings.length } });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
    }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('busId', 'busNumber busType')
            .populate('routeId', 'routeName routeNumber stops')
            .populate('tripId', 'startTime status');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: { booking } });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
        }
        if (booking.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel completed booking.' });
        }

        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        await booking.save();

        if (booking.tripId) {
            const seats = booking.seatNumbers?.length > 0 ? booking.seatNumbers : [booking.seatNumber];
            await Trip.findByIdAndUpdate(booking.tripId, { $pull: { bookedSeats: { $in: seats } } });
        }

        res.json({ success: true, message: 'Booking cancelled successfully.', data: { booking } });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
    }
};

// Get available seats for a trip
export const getAvailableSeats = async (req, res) => {
    try {
        const { tripId } = req.params;
        const trip = await Trip.findById(tripId).populate('busId', 'capacity');
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

        const totalSeats = trip.busId?.capacity || 47;
        const bookedSeats = trip.bookedSeats || [];
        const availableSeats = [];
        for (let i = 1; i <= totalSeats; i++) {
            if (!bookedSeats.includes(i)) availableSeats.push(i);
        }

        res.json({
            success: true,
            data: { totalSeats, bookedSeats, availableSeats, availableCount: availableSeats.length }
        });
    } catch (error) {
        console.error('Get available seats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch available seats.' });
    }
};

// Get all confirmed reservations for a trip (driver view)
export const getTripReservations = async (req, res) => {
    try {
        const { tripId } = req.params;

        const trip = await Trip.findById(tripId).populate('busId', 'capacity');
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

        // Only the driver of this trip or an admin may view passenger details
        const isAdmin = req.user.role === 'admin';
        const isDriver = trip.driverId?.toString() === req.user._id.toString();
        if (!isAdmin && !isDriver) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Broad date window that covers:
        //  • Timezone differences (IST bookings stored as UTC)
        //  • Trips that started the day before
        //  • Advance bookings made for future dates
        const windowStart = new Date(trip.startTime || trip.createdAt);
        windowStart.setDate(windowStart.getDate() - 1); // 1 day before trip start
        windowStart.setHours(0, 0, 0, 0);
        const windowEnd = new Date();
        windowEnd.setDate(windowEnd.getDate() + 2);     // 2 days from now
        windowEnd.setHours(23, 59, 59, 999);

        // Match bookings explicitly linked to this tripId  OR  bookings for the
        // same bus within the generous date window (catches bookings where tripId
        // was null because the trip hadn't started yet when the user booked)
        const bookings = await Booking.find({
            $or: [
                { tripId },
                {
                    busId: trip.busId?._id || trip.busId,
                    travelDate: { $gte: windowStart, $lte: windowEnd }
                }
            ],
            status: { $ne: 'cancelled' }
        })
            .populate('userId', 'name email')
            .sort({ createdAt: 1 });

        // Deduplicate (a booking matching both clauses would appear twice)
        const seen = new Set();
        const uniqueBookings = bookings.filter(b => {
            const id = b._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        const totalSeats = trip.busId?.capacity || 47;

        // Build the reserved seat set from trip.bookedSeats AND from booking seatNumbers
        // so the map is accurate even for bookings that have no tripId
        const reservedSeatSet = new Set(trip.bookedSeats || []);
        for (const b of uniqueBookings) {
            const seats = b.seatNumbers?.length > 0 ? b.seatNumbers : b.seatNumber ? [b.seatNumber] : [];
            seats.forEach(s => reservedSeatSet.add(s));
        }
        const reservedSeats = Array.from(reservedSeatSet).sort((a, b) => a - b);

        res.json({
            success: true,
            data: {
                bookings: uniqueBookings,
                totalSeats,
                reservedSeats,
                reservedCount: reservedSeats.length,
                freeCount: Math.max(0, totalSeats - reservedSeats.length)
            }
        });
    } catch (error) {
        console.error('Get trip reservations error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reservations.' });
    }
};

