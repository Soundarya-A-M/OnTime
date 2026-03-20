import Bus from '../models/Bus.js';
import User from '../models/User.js';

// Create new bus (Admin only)
export const createBus = async (req, res) => {
    try {
        const { busNumber, routeId, capacity, busType, driverId } = req.body;

        // Check if bus number already exists
        const existingBus = await Bus.findOne({ busNumber });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'Bus number already exists.'
            });
        }

        // Verify driver if provided
        if (driverId) {
            const driver = await User.findById(driverId);
            if (!driver || driver.role !== 'driver') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid driver ID or user is not a driver.'
                });
            }
        }

        const bus = await Bus.create({
            busNumber,
            routeId: routeId || null,
            driverId: driverId || null,
            capacity,
            busType: busType || 'Ordinary'
        });

        res.status(201).json({
            success: true,
            message: 'Bus created successfully.',
            data: { bus }
        });
    } catch (error) {
        console.error('Create bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bus.'
        });
    }
};

// Get all buses
export const getAllBuses = async (req, res) => {
    try {
        const { status, isOnTrip } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (isOnTrip !== undefined) filter.isOnTrip = isOnTrip === 'true';

        const buses = await Bus.find(filter)
            .populate('routeId', 'routeName routeNumber')
            .populate('driverId', 'name email phone')
            .sort({ busNumber: 1 });

        res.json({
            success: true,
            data: { buses, count: buses.length }
        });
    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buses.'
        });
    }
};

// Get bus by ID
export const getBusById = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('routeId')
            .populate('driverId', 'name email phone')
            .populate('currentTripId');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found.'
            });
        }

        res.json({
            success: true,
            data: { bus }
        });
    } catch (error) {
        console.error('Get bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bus.'
        });
    }
};

// Update bus (Admin only)
export const updateBus = async (req, res) => {
    try {
        const { routeId, capacity, status, busType } = req.body;

        const updateFields = { routeId, capacity, status };
        if (busType) updateFields.busType = busType;

        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('routeId').populate('driverId', 'name email');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found.'
            });
        }

        res.json({
            success: true,
            message: 'Bus updated successfully.',
            data: { bus }
        });
    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bus.'
        });
    }
};

// Assign driver to bus (Admin only)
export const assignDriver = async (req, res) => {
    try {
        const { driverId } = req.body;

        // Verify driver exists and has driver role
        const driver = await User.findById(driverId);
        if (!driver || driver.role !== 'driver') {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver ID or user is not a driver.'
            });
        }

        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            { driverId },
            { new: true }
        ).populate('driverId', 'name email phone');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found.'
            });
        }

        res.json({
            success: true,
            message: 'Driver assigned successfully.',
            data: { bus }
        });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign driver.'
        });
    }
};

// Update bus location (Driver only - also handled via Socket.IO)
export const updateLocation = async (req, res) => {
    try {
        const { lat, lng, speed } = req.body;

        // Find bus assigned to this driver
        const bus = await Bus.findOne({ driverId: req.user._id });

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'No bus assigned to this driver.'
            });
        }

        bus.currentLocation = {
            coordinates: { lat, lng },
            timestamp: new Date(),
            speed: speed || 0
        };

        await bus.save();

        res.json({
            success: true,
            message: 'Location updated successfully.',
            data: { bus }
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location.'
        });
    }
};
