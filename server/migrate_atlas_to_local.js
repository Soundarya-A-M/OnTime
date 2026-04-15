/**
 * 🚀 Atlas → Local MongoDB Migration Script
 * 
 * This script connects to both your Atlas DB and local MongoDB simultaneously,
 * reads all documents from Atlas, and inserts them into your local DB.
 * 
 * Usage: node migrate_atlas_to_local.js
 */

import mongoose from 'mongoose';

const ATLAS_URI = 'mongodb+srv://snthshkumarrs_db_user:angrybird@cluster0.vpy3dvx.mongodb.net/ontime?retryWrites=true&w=majority&appName=Cluster0';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/ontime';

// All collection names in your DB
const COLLECTIONS = [
    'users',
    'routes',
    'buses',
    'bookings',
    'trips',
    'stages',
    'bustypefares',
];

async function migrate() {
    console.log('\n🔄 Starting Atlas → Local MongoDB Migration...\n');

    // --- Connect to Atlas ---
    console.log('📡 Connecting to MongoDB Atlas...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to Atlas\n');

    // --- Connect to Local ---
    console.log('💻 Connecting to Local MongoDB...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB\n');

    const summary = [];

    for (const collectionName of COLLECTIONS) {
        try {
            // Get collection handles directly (schema-less raw access)
            const atlasCollection = atlasConn.collection(collectionName);
            const localCollection = localConn.collection(collectionName);

            // Check if collection exists in Atlas
            const count = await atlasCollection.countDocuments();
            if (count === 0) {
                console.log(`⏭️  Skipping '${collectionName}' — empty or not found in Atlas`);
                summary.push({ collection: collectionName, status: 'skipped', count: 0 });
                continue;
            }

            console.log(`📦 Migrating '${collectionName}' (${count} documents)...`);

            // Fetch all docs from Atlas
            const docs = await atlasCollection.find({}).toArray();

            // Drop existing local collection to avoid duplicates
            await localCollection.drop().catch(() => {}); // ignore error if doesn't exist

            // Insert into local
            if (docs.length > 0) {
                await localCollection.insertMany(docs, { ordered: false });
            }

            console.log(`   ✅ Migrated ${docs.length} documents to local '${collectionName}'\n`);
            summary.push({ collection: collectionName, status: 'success', count: docs.length });

        } catch (err) {
            console.error(`   ❌ Error migrating '${collectionName}':`, err.message, '\n');
            summary.push({ collection: collectionName, status: 'error', error: err.message });
        }
    }

    // --- Print Summary ---
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const item of summary) {
        const icon = item.status === 'success' ? '✅' : item.status === 'skipped' ? '⏭️ ' : '❌';
        const detail = item.status === 'error' ? `ERROR: ${item.error}` : `${item.count} docs`;
        console.log(`  ${icon} ${item.collection.padEnd(20)} ${detail}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await atlasConn.close();
    await localConn.close();
    console.log('🎉 Migration complete! Your local MongoDB is ready.\n');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Fatal migration error:', err);
    process.exit(1);
});
