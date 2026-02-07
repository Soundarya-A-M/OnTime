import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Route from './models/Route.js';
import Bus from './models/Bus.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected for seeding'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

const seedDatabase = async () => {
    try {
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Route.deleteMany({});
        await Bus.deleteMany({});

        console.log('👤 Creating users...');

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@ontime.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            phone: '+91 9876543210'
        });

        const driver1 = await User.create({
            name: 'Rajesh Kumar',
            email: 'driver1@ontime.com',
            password: await bcrypt.hash('driver123', 10),
            role: 'driver',
            phone: '+91 9876543211'
        });

        const driver2 = await User.create({
            name: 'Suresh Patel',
            email: 'driver2@ontime.com',
            password: await bcrypt.hash('driver123', 10),
            role: 'driver',
            phone: '+91 9876543212'
        });

        const driver3 = await User.create({
            name: 'Amit Singh',
            email: 'driver3@ontime.com',
            password: await bcrypt.hash('driver123', 10),
            role: 'driver',
            phone: '+91 9876543213'
        });

        const passenger1 = await User.create({
            name: 'John Doe',
            email: 'user@ontime.com',
            password: await bcrypt.hash('user123', 10),
            role: 'passenger',
            phone: '+91 9876543220'
        });

        const passenger2 = await User.create({
            name: 'Jane Smith',
            email: 'jane@ontime.com',
            password: await bcrypt.hash('user123', 10),
            role: 'passenger',
            phone: '+91 9876543221'
        });

        console.log('✅ Users created');
        console.log('🛣️  Creating routes...');

        const route1 = await Route.create({
            routeName: 'Bangalore - Mysore Express',
            routeNumber: 'RT-101',
            stops: [
                { name: 'Bangalore City Bus Stand', coordinates: { lat: 12.9716, lng: 77.5946 }, order: 1 },
                { name: 'Kengeri', coordinates: { lat: 12.9081, lng: 77.4857 }, order: 2 },
                { name: 'Ramanagara', coordinates: { lat: 12.7177, lng: 77.2816 }, order: 3 },
                { name: 'Mandya', coordinates: { lat: 12.5244, lng: 76.8958 }, order: 4 },
                { name: 'Srirangapatna', coordinates: { lat: 12.4181, lng: 76.6947 }, order: 5 },
                { name: 'Mysore City Bus Stand', coordinates: { lat: 12.2958, lng: 76.6394 }, order: 6 }
            ],
            distance: 145,
            estimatedDuration: 180
        });

        const route2 = await Route.create({
            routeName: 'Chennai - Salem Highway',
            routeNumber: 'RT-202',
            stops: [
                { name: 'Chennai CMBT', coordinates: { lat: 13.0827, lng: 80.2707 }, order: 1 },
                { name: 'Kanchipuram', coordinates: { lat: 12.8342, lng: 79.7036 }, order: 2 },
                { name: 'Vellore', coordinates: { lat: 12.9165, lng: 79.1325 }, order: 3 },
                { name: 'Krishnagiri', coordinates: { lat: 12.5186, lng: 78.2137 }, order: 4 },
                { name: 'Dharmapuri', coordinates: { lat: 12.1211, lng: 78.1582 }, order: 5 },
                { name: 'Salem New Bus Stand', coordinates: { lat: 11.6643, lng: 78.1460 }, order: 6 }
            ],
            distance: 340,
            estimatedDuration: 360
        });

        const route3 = await Route.create({
            routeName: 'Mumbai - Pune Expressway',
            routeNumber: 'RT-303',
            stops: [
                { name: 'Mumbai Central', coordinates: { lat: 19.0760, lng: 72.8777 }, order: 1 },
                { name: 'Panvel', coordinates: { lat: 18.9894, lng: 73.1178 }, order: 2 },
                { name: 'Lonavala', coordinates: { lat: 18.7537, lng: 73.4076 }, order: 3 },
                { name: 'Khandala', coordinates: { lat: 18.7467, lng: 73.3850 }, order: 4 },
                { name: 'Pune Swargate', coordinates: { lat: 18.5204, lng: 73.8567 }, order: 5 }
            ],
            distance: 150,
            estimatedDuration: 150
        });

        const route4 = await Route.create({
            routeName: 'Mysore - Ooty Hill Route',
            routeNumber: 'RT-404',
            stops: [
                { name: 'Mysore City Bus Stand', coordinates: { lat: 12.2958, lng: 76.6394 }, order: 1 },
                { name: 'Nanjangud', coordinates: { lat: 12.1176, lng: 76.6838 }, order: 2 },
                { name: 'Gundlupet', coordinates: { lat: 11.8089, lng: 76.6833 }, order: 3 },
                { name: 'Bandipur', coordinates: { lat: 11.6904, lng: 76.6850 }, order: 4 },
                { name: 'Gudalur', coordinates: { lat: 11.5081, lng: 76.4969 }, order: 5 },
                { name: 'Ooty Bus Stand', coordinates: { lat: 11.4102, lng: 76.6950 }, order: 6 }
            ],
            distance: 125,
            estimatedDuration: 210
        });

        console.log('✅ Routes created');
        console.log('🚌 Creating buses...');

        const bus1 = await Bus.create({
            busNumber: 'KA-01-AB-1234',
            routeId: route1._id,
            driverId: driver1._id,
            capacity: 40,
            status: 'active',
            currentLocation: {
                coordinates: { lat: 12.9716, lng: 77.5946 },
                lastUpdated: new Date()
            }
        });

        const bus2 = await Bus.create({
            busNumber: 'TN-09-CD-5678',
            routeId: route2._id,
            driverId: driver2._id,
            capacity: 45,
            status: 'active',
            currentLocation: {
                coordinates: { lat: 13.0827, lng: 80.2707 },
                lastUpdated: new Date()
            }
        });

        const bus3 = await Bus.create({
            busNumber: 'MH-12-EF-9012',
            routeId: route3._id,
            driverId: driver3._id,
            capacity: 50,
            status: 'active',
            currentLocation: {
                coordinates: { lat: 19.0760, lng: 72.8777 },
                lastUpdated: new Date()
            }
        });

        const bus4 = await Bus.create({
            busNumber: 'KA-05-GH-3456',
            routeId: route4._id,
            capacity: 35,
            status: 'inactive'
        });

        const bus5 = await Bus.create({
            busNumber: 'KA-09-IJ-7890',
            capacity: 40,
            status: 'maintenance'
        });

        console.log('✅ Buses created');
        console.log('\n🎉 Database seeded successfully!\n');
        console.log('📋 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Admin:');
        console.log('   Email: admin@ontime.com');
        console.log('   Password: admin123');
        console.log('\n🚗 Drivers:');
        console.log('   Email: driver1@ontime.com | Password: driver123');
        console.log('   Email: driver2@ontime.com | Password: driver123');
        console.log('   Email: driver3@ontime.com | Password: driver123');
        console.log('\n👥 Passengers:');
        console.log('   Email: user@ontime.com | Password: user123');
        console.log('   Email: jane@ontime.com | Password: user123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📊 Summary:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Routes: ${await Route.countDocuments()}`);
        console.log(`   Buses: ${await Bus.countDocuments()}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
