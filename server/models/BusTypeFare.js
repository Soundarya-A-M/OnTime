import mongoose from 'mongoose';

const busTypeFareSchema = new mongoose.Schema({
    busType: {
        type: String,
        required: [true, 'Bus type is required'],
        unique: true,
        trim: true
    },
    pricePerKM: {
        type: Number,
        required: [true, 'Price per KM is required'],
        min: 0
    }
}, {
    timestamps: true
});

busTypeFareSchema.index({ busType: 1 });

const BusTypeFare = mongoose.model('BusTypeFare', busTypeFareSchema);

export default BusTypeFare;
