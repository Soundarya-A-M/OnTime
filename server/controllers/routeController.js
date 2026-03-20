import Route from '../models/Route.js';

// Create new route (Admin only)
export const createRoute = async (req, res) => {
    try {
        const {
            routeName, routeNumber, stops, distance, estimatedDuration,
            sourceCity, destinationCity, sourceCoordinates, destinationCoordinates, polyline
        } = req.body;

        // Check if route number already exists
        const existingRoute = await Route.findOne({ routeNumber });
        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: 'Route number already exists.'
            });
        }

        const route = await Route.create({
            routeName,
            routeNumber,
            stops: stops || [],
            distance: distance || 0,
            estimatedDuration: estimatedDuration || 0,
            sourceCity: sourceCity || '',
            destinationCity: destinationCity || '',
            sourceCoordinates: sourceCoordinates || { lat: null, lng: null },
            destinationCoordinates: destinationCoordinates || { lat: null, lng: null },
            polyline: polyline || null
        });

        res.status(201).json({
            success: true,
            message: 'Route created successfully.',
            data: { route }
        });
    } catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create route.'
        });
    }
};

// Get all routes
export const getAllRoutes = async (req, res) => {
    try {
        const { isActive } = req.query;
        const filter = {};

        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const routes = await Route.find(filter).sort({ routeName: 1 });

        res.json({
            success: true,
            data: { routes, count: routes.length }
        });
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch routes.'
        });
    }
};

// Get route by ID
export const getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found.'
            });
        }

        res.json({
            success: true,
            data: { route }
        });
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch route.'
        });
    }
};

// Update route (Admin only)
export const updateRoute = async (req, res) => {
    try {
        const {
            routeName, stops, distance, estimatedDuration, isActive,
            sourceCity, destinationCity, sourceCoordinates, destinationCoordinates, polyline
        } = req.body;

        const updateFields = {
            routeName, stops, distance, estimatedDuration, isActive,
            sourceCity, destinationCity, sourceCoordinates, destinationCoordinates, polyline
        };
        // Remove undefined keys to avoid overwriting with null
        Object.keys(updateFields).forEach(k => updateFields[k] === undefined && delete updateFields[k]);

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found.'
            });
        }

        res.json({
            success: true,
            message: 'Route updated successfully.',
            data: { route }
        });
    } catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update route.'
        });
    }
};

// Delete route (Admin only - soft delete)
export const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found.'
            });
        }

        res.json({
            success: true,
            message: 'Route deleted successfully.',
            data: { route }
        });
    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete route.'
        });
    }
};
