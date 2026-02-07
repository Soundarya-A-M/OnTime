import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    seatNumber: {
        type: Number,
        required: true,
        min: 1
    },
    fromStop: {
        type: String,
        required: true
    },
    toStop: {
        type: String,
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    travelDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'paid'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    ticketId: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});

// Generate unique ticket ID before saving
bookingSchema.pre('save', function (next) {
    if (!this.ticketId) {
        this.ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

// Index for faster user booking lookups
bookingSchema.index({ userId: 1, bookingDate: -1 });
bookingSchema.index({ ticketId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
