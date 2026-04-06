import Trip from '../models/Trip.js';
import Bus from '../models/Bus.js';
import Stage from '../models/Stage.js';
import { getIO } from '../socket/ioInstance.js';

// Start a new trip (Driver only)
export const startTrip = async (req, res) => {
    try {
        const { routeId, busId, trackingMode } = req.body;

        if (!busId) {
            return res.status(400).json({
                success: false,
                message: 'Bus ID is required to start a trip.'
            });
        }

        // Find bus assigned to this driver that matches the requested busId
        const bus = await Bus.findOne({ _id: busId, driverId: req.user._id });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'No bus assigned to this driver.'
            });
        }

        // Check if bus is already on a trip
        if (bus.isOnTrip) {
            return res.status(400).json({
                success: false,
                message: 'Bus is already on an active trip.'
            });
        }

        const tripRouteId = routeId || bus.routeId;

        // Get the first stage of the route (source city)
        const firstStage = await Stage.findOne({ routeId: tripRouteId }).sort({ stageOrder: 1 });

        // Create new trip with initial stage set to source
        const trip = await Trip.create({
            busId: bus._id,
            routeId: tripRouteId,
            driverId: req.user._id,
            status: 'in-progress',
            trackingMode: trackingMode === 'gps' ? 'gps' : 'manual',
            currentStageId: firstStage?._id || null,
            currentStageName: firstStage?.stageName || '',
            currentStageCoords: firstStage ? { lat: firstStage.latitude, lng: firstStage.longitude } : { lat: null, lng: null }
        });

        // Update bus status
        bus.isOnTrip = true;
        bus.status = 'active';
        bus.currentTripId = trip._id;
        await bus.save();

        // Emit stage update so TrackBus map shows stage immediately
        if (firstStage) {
            const io = getIO();
            if (io) {
                io.emit('bus:stage-updated', {
                    tripId: trip._id,
                    busId: bus._id,
                    stageName: firstStage.stageName,
                    stageOrder: firstStage.stageOrder,
                    lat: firstStage.latitude,
                    lng: firstStage.longitude,
                    timestamp: new Date()
                });
            }
        }

        const populatedTrip = await Trip.findById(trip._id)
            .populate('busId', 'busNumber')
            .populate('routeId', 'routeName routeNumber');

        res.status(201).json({
            success: true,
            message: 'Trip started successfully.',
            data: { trip: populatedTrip }
        });
    } catch (error) {
        console.error('Start trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start trip.'
        });
    }
};

// End a trip (Driver only)
export const endTrip = async (req, res) => {
    try {
        const { id } = req.params;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Verify this trip belongs to the driver
        if (trip.driverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to end this trip.'
            });
        }

        // Update trip
        trip.status = 'completed';
        trip.endTime = new Date();
        await trip.save();

        // Update bus status
        await Bus.findByIdAndUpdate(trip.busId, {
            isOnTrip: false,
            status: 'inactive',
            currentTripId: null
        });

        res.json({
            success: true,
            message: 'Trip ended successfully.',
            data: { trip }
        });
    } catch (error) {
        console.error('End trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end trip.'
        });
    }
};

// Get all active trips
export const getActiveTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ status: 'in-progress' })
            .populate('busId', 'busNumber currentLocation')
            .populate('routeId', 'routeName routeNumber stops')
            .populate('driverId', 'name phone')
            .sort({ startTime: -1 });

        res.json({
            success: true,
            data: { trips, count: trips.length }
        });
    } catch (error) {
        console.error('Get active trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active trips.'
        });
    }
};

// Get trip history (Admin only)
export const getTripHistory = async (req, res) => {
    try {
        const { status, busId, driverId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (busId) filter.busId = busId;
        if (driverId) filter.driverId = driverId;

        const trips = await Trip.find(filter)
            .populate('busId', 'busNumber')
            .populate('routeId', 'routeName routeNumber')
            .populate('driverId', 'name')
            .sort({ startTime: -1 })
            .limit(100);

        res.json({
            success: true,
            data: { trips, count: trips.length }
        });
    } catch (error) {
        console.error('Get trip history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip history.'
        });
    }
};

// Get driver's current trip
export const getMyCurrentTrip = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            driverId: req.user._id,
            status: 'in-progress'
        })
            .populate('busId', 'busNumber currentLocation')
            .populate('routeId', 'routeName routeNumber stops');

        if (trip) {
            // Validate the trip is genuinely active:
            // Fetch the specific bus associated with this trip
            const tripBus = await Bus.findById(trip.busId._id || trip.busId);
            
            const driverReassigned = !tripBus || tripBus.driverId?.toString() !== req.user._id.toString();
            const busNotOnTrip = tripBus && !tripBus.isOnTrip;

            if (driverReassigned || busNotOnTrip) {
                // Stale trip — driver was reassigned or bus was reset externally
                trip.status = 'completed';
                trip.endTime = new Date();
                await trip.save();
                // Clean up bus if necessary
                if (tripBus && busNotOnTrip) {
                    await Bus.findByIdAndUpdate(tripBus._id, {
                        isOnTrip: false, currentTripId: null
                    });
                }
                return res.json({ success: true, data: { trip: null } });
            }
        }

        res.json({
            success: true,
            data: { trip }
        });
    } catch (error) {
        console.error('Get current trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current trip.'
        });
    }
};
