import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function dropAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections`);
        for (const col of collections) {
            await mongoose.connection.db.dropCollection(col.name);
            console.log(`  Dropped: ${col.name}`);
        }
        console.log('\nAll data removed successfully!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
dropAll();
