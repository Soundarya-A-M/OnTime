import Trip from '../models/Trip.js';
import Stage from '../models/Stage.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { getIO } from '../socket/ioInstance.js';

// POST /api/trips/:id/advance-stage
export const advanceStage = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
        if (trip.driverId.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: 'Not your trip.' });

        const { stageId } = req.body;
        const stage = await Stage.findById(stageId);
        if (!stage) return res.status(404).json({ success: false, message: 'Stage not found.' });

        // Only allow advancing forward
        if (trip.currentStageId) {
            const current = await Stage.findById(trip.currentStageId);
            if (current && stage.stageOrder <= current.stageOrder)
                return res.status(400).json({ success: false, message: 'Cannot go backwards.' });
        }

        trip.currentStageId = stage._id;
        trip.currentStageName = stage.stageName;
        trip.currentStageCoords = { lat: stage.latitude, lng: stage.longitude };
        await trip.save();

        const io = getIO();
        if (io) {
            io.emit('bus:stage-updated', {
                tripId: trip._id,
                busId: trip.busId,
                stageName: stage.stageName,
                stageOrder: stage.stageOrder,
                lat: stage.latitude,
                lng: stage.longitude,
                timestamp: new Date()
            });
        }

        res.json({ success: true, data: { stageName: stage.stageName } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to advance stage.' });
    }
};

// POST /api/trips/:id/etm-ticket
export const issueETMTicket = async (req, res) => {
    try {
        const { fromStageId, toStageId, passengerName, passengerPhone, amount } = req.body;

        const trip = await Trip.findById(req.params.id).populate('busId').populate('routeId');
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
        if (trip.status !== 'in-progress')
            return res.status(400).json({ success: false, message: 'Trip is not active.' });
        if (trip.driverId.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: 'Not your trip.' });

        const [fromStage, toStage] = await Promise.all([
            Stage.findById(fromStageId),
            Stage.findById(toStageId)
        ]);
        if (!fromStage || !toStage)
            return res.status(404).json({ success: false, message: 'Stage not found.' });

        // Auto-advance: if boarding stage is ahead of current stage, advance it
        const current = await Stage.findById(trip.currentStageId);
        if (!current || fromStage.stageOrder > current.stageOrder) {
            trip.currentStageId = fromStage._id;
            trip.currentStageName = fromStage.stageName;
            trip.currentStageCoords = { lat: fromStage.latitude, lng: fromStage.longitude };
            await trip.save();

            const io = getIO();
            if (io) {
                io.emit('bus:stage-updated', {
                    tripId: trip._id,
                    busId: trip.busId._id,
                    stageName: fromStage.stageName,
                    stageOrder: fromStage.stageOrder,
                    lat: fromStage.latitude,
                    lng: fromStage.longitude,
                    timestamp: new Date()
                });
            }
        }

        const ticketId = `ETM${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

        const booking = await Booking.create({
            userId: req.user._id,
            busId: trip.busId._id,
            routeId: trip.routeId._id,
            tripId: trip._id,
            seatNumber: 1,   // walk-in ticket — no reserved seat
            seatNumbers: [],
            fromStop: fromStage.stageName,
            toStop: toStage.stageName,
            travelDate: new Date(),
            amount: amount || 0,
            passengerDetails: { name: passengerName || 'Walk-in', phone: passengerPhone || '' },
            ticketId,
            status: 'confirmed',
            paymentStatus: 'paid'
        });

        await User.findByIdAndUpdate(req.user._id, { $push: { bookingHistory: booking._id } });

        res.status(201).json({
            success: true,
            data: {
                ticketId,
                fromStop: fromStage.stageName,
                toStop: toStage.stageName,
                amount,
                busNumber: trip.busId.busNumber,
                routeName: trip.routeId.routeName,
                issuedAt: new Date()
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to issue ticket.' });
    }
};

// GET /api/trips/:id/current-stage
export const getCurrentStage = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .select('currentStageId currentStageName currentStageCoords status busId');
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
        res.json({ success: true, data: trip });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch stage.' });
    }
};
