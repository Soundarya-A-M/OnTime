import BusTypeFare from '../models/BusTypeFare.js';

// Get all bus type fares
export const getAllBusTypeFares = async (req, res) => {
    try {
        const fares = await BusTypeFare.find().sort({ busType: 1 });
        res.json({ success: true, data: { fares, count: fares.length } });
    } catch (error) {
        console.error('Get fares error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bus type fares.' });
    }
};

// Create a bus type fare
export const createBusTypeFare = async (req, res) => {
    try {
        const { busType, pricePerKM } = req.body;

        const existing = await BusTypeFare.findOne({ busType });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Bus type fare already exists.' });
        }

        const fare = await BusTypeFare.create({ busType, pricePerKM });

        res.status(201).json({
            success: true,
            message: 'Bus type fare created successfully.',
            data: { fare }
        });
    } catch (error) {
        console.error('Create fare error:', error);
        res.status(500).json({ success: false, message: 'Failed to create bus type fare.' });
    }
};

// Update a bus type fare
export const updateBusTypeFare = async (req, res) => {
    try {
        const { pricePerKM } = req.body;

        const fare = await BusTypeFare.findByIdAndUpdate(
            req.params.id,
            { pricePerKM },
            { new: true, runValidators: true }
        );

        if (!fare) {
            return res.status(404).json({ success: false, message: 'Bus type fare not found.' });
        }

        res.json({
            success: true,
            message: 'Bus type fare updated successfully.',
            data: { fare }
        });
    } catch (error) {
        console.error('Update fare error:', error);
        res.status(500).json({ success: false, message: 'Failed to update bus type fare.' });
    }
};
