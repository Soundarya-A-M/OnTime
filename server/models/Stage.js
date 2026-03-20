import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: [true, 'Route ID is required']
    },
    stageName: {
        type: String,
        required: [true, 'Stage name is required'],
        trim: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
    },
    stageOrder: {
        type: Number,
        required: [true, 'Stage order is required'],
        min: 0
    },
    distanceFromOrigin: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Index for route lookup
stageSchema.index({ routeId: 1, stageOrder: 1 });

const Stage = mongoose.model('Stage', stageSchema);

export default Stage;
