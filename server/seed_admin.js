import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('password', 10);
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@ontime.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true
        });

        console.log(`Admin created: ${admin.email} (role: ${admin.role})`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();
