import Stage from '../models/Stage.js';
import Bus from '../models/Bus.js';
import BusTypeFare from '../models/BusTypeFare.js';

// Calculate fare between two stages for a given bus
// GET /api/fare/calculate?fromStageId=&toStageId=&busId=
export const calculateFare = async (req, res) => {
    try {
        const { fromStageId, toStageId, busId } = req.query;

        if (!fromStageId || !toStageId || !busId) {
            return res.status(400).json({
                success: false,
                message: 'fromStageId, toStageId, and busId are required query parameters.'
            });
        }

        // Fetch both stages and bus concurrently
        const [fromStage, toStage, bus] = await Promise.all([
            Stage.findById(fromStageId),
            Stage.findById(toStageId),
            Bus.findById(busId)
        ]);

        if (!fromStage) return res.status(404).json({ success: false, message: 'Boarding stage not found.' });
        if (!toStage) return res.status(404).json({ success: false, message: 'Destination stage not found.' });
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

        // Validate same route
        if (fromStage.routeId.toString() !== toStage.routeId.toString()) {
            return res.status(400).json({ success: false, message: 'Stages must belong to the same route.' });
        }

        // Validate direction
        if (toStage.stageOrder <= fromStage.stageOrder) {
            return res.status(400).json({
                success: false,
                message: 'Destination stage must come after boarding stage on this route.'
            });
        }

        // Calculate distance between stages
        const distance = toStage.distanceFromOrigin - fromStage.distanceFromOrigin;

        // Fetch bus type fare
        const busType = bus.busType || 'Ordinary';
        const fareRecord = await BusTypeFare.findOne({ busType });

        if (!fareRecord) {
            return res.status(404).json({
                success: false,
                message: `No fare configured for bus type: ${busType}. Please set up bus type fares first.`
            });
        }

        const pricePerKM = fareRecord.pricePerKM;
        const fare = Math.round(distance * pricePerKM);

        res.json({
            success: true,
            data: {
                fare,
                distance: Math.round(distance * 10) / 10,
                busType,
                pricePerKM,
                fromStage: {
                    _id: fromStage._id,
                    stageName: fromStage.stageName,
                    distanceFromOrigin: fromStage.distanceFromOrigin
                },
                toStage: {
                    _id: toStage._id,
                    stageName: toStage.stageName,
                    distanceFromOrigin: toStage.distanceFromOrigin
                }
            }
        });
    } catch (error) {
        console.error('Calculate fare error:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate fare.' });
    }
};
