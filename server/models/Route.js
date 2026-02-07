import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: [true, 'Route name is required'],
        trim: true
    },
    routeNumber: {
        type: String,
        required: [true, 'Route number is required'],
        unique: true,
        trim: true
    },
    stops: [{
        name: {
            type: String,
            required: true
        },
        coordinates: {
            lat: {
                type: Number,
                required: true,
                min: -90,
                max: 90
            },
            lng: {
                type: Number,
                required: true,
                min: -180,
                max: 180
            }
        },
        order: {
            type: Number,
            required: true
        }
    }],
    distance: {
        type: Number,
        required: true,
        min: 0
    },
    estimatedDuration: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster route number lookups
routeSchema.index({ routeNumber: 1 });

const Route = mongoose.model('Route', routeSchema);

export default Route;
