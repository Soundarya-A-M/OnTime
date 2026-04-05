import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: [true, 'Bus number is required'],
        unique: true,
        trim: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        default: null
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: 1,
        default: 40
    },
    currentLocation: {
        coordinates: {
            lat: {
                type: Number,
                default: 0
            },
            lng: {
                type: Number,
                default: 0
            }
        },
        timestamp: {
            type: Date,
            default: null
        },
        speed: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'inactive'
    },
    isOnTrip: {
        type: Boolean,
        default: false
    },
    currentTripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        default: null
    },
    busType: {
        type: String,
        trim: true,
        default: 'Ordinary'
    }
}, {
    timestamps: true
});

// Index for finding active buses
busSchema.index({ status: 1, isOnTrip: 1 });

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
