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
        default: null   // optional — booking can exist without an active trip
    },
    seatNumber: {
        type: Number,
        required: true,
        min: 1
    },
    // Multi-seat support
    seatNumbers: {
        type: [Number],
        default: []
    },
    fromStop: {
        type: String,
        default: ''
    },
    toStop: {
        type: String,
        default: ''
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
    },
    // Passenger details stored on booking for e-ticket
    passengerDetails: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' }
    }
}, {
    timestamps: true
});

bookingSchema.pre('save', function (next) {
    if (!this.ticketId) {
        this.ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
    // Keep seatNumbers in sync with seatNumber for legacy support
    if (this.seatNumbers.length === 0 && this.seatNumber) {
        this.seatNumbers = [this.seatNumber];
    }
    next();
});

bookingSchema.index({ userId: 1, bookingDate: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
