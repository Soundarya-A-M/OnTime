import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'in-progress'
    },
    bookedSeats: [{
        type: Number
    }],
    currentStageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stage',
        default: null
    },
    currentStageName: {
        type: String,
        default: ''
    },
    currentStageCoords: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    locationHistory: [{
        coordinates: {
            lat: Number,
            lng: Number
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        speed: {
            type: Number,
            default: 0
        }
    }],
    delayMinutes: {
        type: Number,
        default: 0
    },
    delayReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for finding active trips
tripSchema.index({ status: 1, busId: 1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
