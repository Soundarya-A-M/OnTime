import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';
import { getIO } from '../socket/ioInstance.js';

// POST /api/trips/:id/delay  (Driver only)
export const reportDelay = async (req, res) => {
    try {
        const { id: tripId } = req.params;
        const { delayMinutes, delayReason } = req.body;

        if (!delayMinutes || delayMinutes <= 0) {
            return res.status(400).json({
                success: false,
                message: 'delayMinutes must be a positive number.'
            });
        }

        // Fetch trip with bus and route info
        const trip = await Trip.findById(tripId)
            .populate('busId', 'busNumber routeId')
            .populate('routeId', 'routeName');

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found.' });
        }

        // Only the assigned driver can report a delay
        if (trip.driverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to report delay for this trip.'
            });
        }

        // Persist delay to the trip document
        trip.delayMinutes = delayMinutes;
        trip.delayReason = delayReason || '';
        await trip.save();

        // Build payload for Socket.IO broadcast
        const payload = {
            tripId: trip._id,
            busId: trip.busId?._id,
            busNumber: trip.busId?.busNumber,
            routeName: trip.routeId?.routeName,
            delayMinutes,
            delayReason: delayReason || '',
            timestamp: new Date()
        };

        // Broadcast to all connected clients
        const io = getIO();
        if (io) {
            io.emit('trip:delay', payload);
        }

        console.log(`🚨 Delay reported for trip ${tripId}: ${delayMinutes} min — ${delayReason}`);

        res.json({
            success: true,
            message: `Delay of ${delayMinutes} minutes reported.`,
            data: { trip }
        });
    } catch (error) {
        console.error('Report delay error:', error);
        res.status(500).json({ success: false, message: 'Failed to report delay.' });
    }
};

// GET /api/trips/:id/delay — get current delay for a trip
export const getDelay = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).select('delayMinutes delayReason status');
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

        res.json({
            success: true,
            data: {
                delayMinutes: trip.delayMinutes,
                delayReason: trip.delayReason
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get delay info.' });
    }
};
