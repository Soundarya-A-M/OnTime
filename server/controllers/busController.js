import Bus from '../models/Bus.js';
import User from '../models/User.js';
import Stage from '../models/Stage.js';
import Trip from '../models/Trip.js';

// Create new bus (Admin only)
export const createBus = async (req, res) => {
    try {
        const { busNumber, routeId, capacity, busType, driverId } = req.body;

        const existingBus = await Bus.findOne({ busNumber });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'Bus number already exists.'
            });
        }

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
        res.status(500).json({ success: false, message: 'Failed to create bus.' });
    }
};

// Get all buses — supports ?status=, ?isOnTrip=, ?routeId= filters
export const getAllBuses = async (req, res) => {
    try {
        const { status, isOnTrip, routeId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (isOnTrip !== undefined) filter.isOnTrip = isOnTrip === 'true';
        // FIX: handle routeId filter so BookTicket step 2 only shows buses on selected route
        if (routeId) filter.routeId = routeId;

        const buses = await Bus.find(filter)
            .populate('routeId', 'routeName routeNumber polyline sourceCoordinates destinationCoordinates stops')
            .populate('driverId', 'name email phone')
            .populate('currentTripId', 'currentPassengers passengerDropoffs trackingMode delayMinutes delayReason')
            .sort({ busNumber: 1 });

        res.json({
            success: true,
            data: { buses, count: buses.length }
        });
    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch buses.' });
    }
};

// Get bus by ID
export const getBusById = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('routeId', 'routeName routeNumber polyline sourceCoordinates destinationCoordinates stops')
            .populate('driverId', 'name email phone')
            .populate('currentTripId', 'currentPassengers passengerDropoffs trackingMode delayMinutes delayReason');

        if (!bus) {
            return res.status(404).json({ success: false, message: 'Bus not found.' });
        }

        res.json({ success: true, data: { bus } });
    } catch (error) {
        console.error('Get bus error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bus.' });
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
            return res.status(404).json({ success: false, message: 'Bus not found.' });
        }

        res.json({ success: true, message: 'Bus updated successfully.', data: { bus } });
    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update bus.' });
    }
};

// Assign driver to bus (Admin only)
export const assignDriver = async (req, res) => {
    try {
        const { driverId } = req.body;

        const driver = await User.findById(driverId);
        if (!driver || driver.role !== 'driver') {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver ID or user is not a driver.'
            });
        }

        // Clean up any stale in-progress trips for this driver from their old bus
        const staleTrip = await Trip.findOne({ driverId, status: 'in-progress' });
        if (staleTrip) {
            staleTrip.status = 'completed';
            staleTrip.endTime = new Date();
            await staleTrip.save();
            // Also clean up the old bus record
            await Bus.findByIdAndUpdate(staleTrip.busId, {
                isOnTrip: false,
                status: 'inactive',
                currentTripId: null
            });
        }
        
        // Remove driver from any other buses they were previously assigned to
        await Bus.updateMany(
            { driverId, _id: { $ne: req.params.id } },
            { $set: { driverId: null } }
        );

        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            { driverId },
            { new: true }
        ).populate('driverId', 'name email phone');

        if (!bus) {
            return res.status(404).json({ success: false, message: 'Bus not found.' });
        }

        res.json({ success: true, message: 'Driver assigned successfully.', data: { bus } });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign driver.' });
    }
};

// Update bus location (Driver only - also handled via Socket.IO)
export const updateLocation = async (req, res) => {
    try {
        const { lat, lng, speed } = req.body;

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

        res.json({ success: true, message: 'Location updated successfully.', data: { bus } });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ success: false, message: 'Failed to update location.' });
    }
};

// Search buses (Direct & Partial matches)
export const searchBuses = async (req, res) => {
    try {
        const { from, to, date } = req.query; // 'from' and 'to' are stageNames
        
        if (!from || !to) {
            return res.status(400).json({ success: false, message: 'Please provide both from and to locations.' });
        }

        // Fetch Stage docs for 'from' and 'to' to get their coordinates
        const fromStages = await Stage.find({ stageName: from }).populate('routeId', 'isActive');
        const toStages = await Stage.find({ stageName: to }).populate('routeId', 'isActive');

        if (fromStages.length === 0 || toStages.length === 0) {
            return res.json({ success: true, data: { directBuses: [], partialBuses: [] } });
        }

        const directRouteIds = [];
        const validPartialRoutes = [];

        // Distinguish Direct vs Partial routes
        // For Direct: route must have both From and To, and From.order < To.order
        for (const fStage of fromStages) {
            if (!fStage.routeId?.isActive) continue; // Skip inactive routes
            const rId = fStage.routeId._id.toString();
            const tStage = toStages.find(t => t.routeId?._id?.toString() === rId);
            
            if (tStage && fStage.stageOrder < tStage.stageOrder) {
                directRouteIds.push(rId);
            } else if (!tStage) {
                // If it doesn't have the 'to' stage, it might be a partial route
                validPartialRoutes.push(fStage);
            }
        }

        // Get buses for Direct routes
        const directBusesDocs = await Bus.find({ 
            routeId: { $in: directRouteIds }, 
            status: 'active' 
        })
        .populate('routeId')
        .populate('driverId', 'name');

        const directBuses = directBusesDocs.map(bus => {
            return {
                bus,
                type: 'direct',
                fromStage: fromStages.find(s => s.routeId?._id?.toString() === bus.routeId._id.toString()),
                toStage: toStages.find(s => s.routeId?._id?.toString() === bus.routeId._id.toString())
            };
        });

        // For partial routes
        // Find the Stage on the route (after `from`) that is geographically closest to any `To` stage coordinate.
        const partialBuses = [];
        const toTargetCoords = { lat: toStages[0].latitude, lng: toStages[0].longitude };

        // Haversine function
        const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radius of the earth in km
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
            return R * c; 
        };

        const fromToDistance = getDistanceFromLatLonInKm(fromStages[0].latitude, fromStages[0].longitude, toTargetCoords.lat, toTargetCoords.lng);

        for (const fStage of validPartialRoutes) {
            const rId = fStage.routeId._id;
            // Get all stages for this route after the From stage
            const subsequentStages = await Stage.find({ 
                routeId: rId, 
                stageOrder: { $gt: fStage.stageOrder } 
            });

            if (subsequentStages.length === 0) continue;

            // Find the stop closest to the destination
            let closestStage = null;
            let minDistance = Infinity;

            for (const s of subsequentStages) {
                const dist = getDistanceFromLatLonInKm(s.latitude, s.longitude, toTargetCoords.lat, toTargetCoords.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestStage = s;
                }
            }

            // If the closest stage on this route is closer to the destination than the start point,
            // we consider it a useful partial route. 
            if (minDistance < fromToDistance) {
                const pBuses = await Bus.find({ routeId: rId, status: 'active' })
                    .populate('routeId')
                    .populate('driverId', 'name');

                pBuses.forEach(bus => {
                    partialBuses.push({
                        bus,
                        type: 'partial',
                        fromStage: fStage,
                        toStage: closestStage, // They get off here
                        destinationName: to,
                        remainingDistanceKm: Math.round(minDistance * 10) / 10
                    });
                });
            }
        }

        res.json({
            success: true,
            data: {
                directBuses,
                partialBuses
            }
        });

    } catch (error) {
        console.error('Search buses error:', error);
        res.status(500).json({ success: false, message: 'Failed to search buses.' });
    }
};
