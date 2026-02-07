import Trip from '../models/Trip.js';
import Bus from '../models/Bus.js';

// Start a new trip (Driver only)
export const startTrip = async (req, res) => {
    try {
        const { routeId } = req.body;

        // Find bus assigned to this driver
        const bus = await Bus.findOne({ driverId: req.user._id });

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

        // Create new trip
        const trip = await Trip.create({
            busId: bus._id,
            routeId: routeId || bus.routeId,
            driverId: req.user._id,
            status: 'in-progress'
        });

        // Update bus status
        bus.isOnTrip = true;
        bus.status = 'active';
        bus.currentTripId = trip._id;
        await bus.save();

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
