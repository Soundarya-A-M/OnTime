import Stage from '../models/Stage.js';
import Route from '../models/Route.js';
import https from 'https';

// Helper: fetch OSRM distance via https (no dependencies needed)
const getOSRMDistance = (originLng, originLat, destLng, destLat) => {
    return new Promise((resolve) => {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.routes && json.routes[0]) {
                        // OSRM returns distance in meters
                        resolve(json.routes[0].distance / 1000);
                    } else {
                        resolve(0);
                    }
                } catch {
                    resolve(0);
                }
            });
        }).on('error', () => resolve(0));
    });
};

// Create a new stage
export const createStage = async (req, res) => {
    try {
        const { routeId, stageName, latitude, longitude, stageOrder } = req.body;

        // Verify route exists and has source coordinates
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found.' });
        }

        let distanceFromOrigin = 0;

        // Calculate distance from origin if route has sourceCoordinates
        if (route.sourceCoordinates?.lat && route.sourceCoordinates?.lng) {
            distanceFromOrigin = await getOSRMDistance(
                route.sourceCoordinates.lng,
                route.sourceCoordinates.lat,
                longitude,
                latitude
            );
            distanceFromOrigin = Math.round(distanceFromOrigin * 10) / 10;
        }

        const stage = await Stage.create({
            routeId,
            stageName,
            latitude,
            longitude,
            stageOrder,
            distanceFromOrigin
        });

        res.status(201).json({
            success: true,
            message: 'Stage created successfully.',
            data: { stage }
        });
    } catch (error) {
        console.error('Create stage error:', error);
        res.status(500).json({ success: false, message: 'Failed to create stage.' });
    }
};

// Get all stages for a route
export const getStagesByRoute = async (req, res) => {
    try {
        const stages = await Stage.find({ routeId: req.params.routeId })
            .sort({ stageOrder: 1 });

        res.json({
            success: true,
            data: { stages, count: stages.length }
        });
    } catch (error) {
        console.error('Get stages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stages.' });
    }
};

// Update a stage
export const updateStage = async (req, res) => {
    try {
        const { stageName, latitude, longitude, stageOrder } = req.body;

        const stage = await Stage.findByIdAndUpdate(
            req.params.id,
            { stageName, latitude, longitude, stageOrder },
            { new: true, runValidators: true }
        );

        if (!stage) {
            return res.status(404).json({ success: false, message: 'Stage not found.' });
        }

        res.json({
            success: true,
            message: 'Stage updated successfully.',
            data: { stage }
        });
    } catch (error) {
        console.error('Update stage error:', error);
        res.status(500).json({ success: false, message: 'Failed to update stage.' });
    }
};

// Delete a stage
export const deleteStage = async (req, res) => {
    try {
        const stage = await Stage.findByIdAndDelete(req.params.id);

        if (!stage) {
            return res.status(404).json({ success: false, message: 'Stage not found.' });
        }

        res.json({
            success: true,
            message: 'Stage deleted successfully.'
        });
    } catch (error) {
        console.error('Delete stage error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete stage.' });
    }
};
