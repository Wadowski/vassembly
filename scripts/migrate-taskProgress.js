#!/usr/bin/env node
/**
 * MongoDB Migration Script for taskProgress Collection
 *
 * Creates the taskProgress collection and necessary indexes for the
 * Real-Time Agent Execution Progress Tracker feature.
 *
 * Usage:
 *   MONGODB_URI=mongodb://localhost:27017/vassembly node scripts/migrate-taskProgress.js
 *
 * Environment Variables:
 *   MONGODB_URI - Full MongoDB connection string (required)
 */

const { MongoClient } = require('mongodb');

const COLLECTION_NAME = 'taskProgress';

const INDEXES = [
  {
    key: { taskId: 1, userId: 1 },
    name: 'idx_taskId_userId',
    unique: false,
  },
  {
    key: { userId: 1, createdAt: -1 },
    name: 'idx_userId_createdAt',
    unique: false,
  },
  {
    key: { completedAt: 1 },
    expireAfterSeconds: 7776000, // 90 days
    name: 'idx_ttl_completedAt',
    sparse: true,
  },
];

const SUCCESS_CODE = 0;
const FAILURE_CODE = 1;

/**
 * Validates that MONGODB_URI environment variable is set
 */
function validateEnvironment() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable not set');
    console.error('   Usage: MONGODB_URI=mongodb://... node scripts/migrate-taskProgress.js');
    process.exit(FAILURE_CODE);
  }
}

/**
 * Creates the taskProgress collection if it doesn't exist
 */
async function createCollection(db) {
  try {
    await db.createCollection(COLLECTION_NAME);
    console.log(`✅ Created collection: ${COLLECTION_NAME}`);
  } catch (error) {
    // Collection may already exist, which is fine
    if (error.codeName === 'NamespaceExists') {
      console.log(`✅ Collection already exists: ${COLLECTION_NAME}`);
    } else {
      throw error;
    }
  }
}

/**
 * Creates MongoDB indexes on the taskProgress collection
 */
async function createIndexes(db) {
  const collection = db.collection(COLLECTION_NAME);

  console.log('\n📋 Creating indexes...');

  for (const indexSpec of INDEXES) {
    const { key, ...options } = indexSpec;

    try {
      const indexName = await collection.createIndex(key, options);
      console.log(`  ✅ Index created: ${options.name || indexName}`);
    } catch (error) {
      // Index may already exist, which is fine
      if (error.codeName === 'IndexAlreadyExists') {
        console.log(`  ℹ️  Index already exists: ${options.name}`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Validates that migration was successful by checking collection and indexes
 */
async function verifyMigration(db) {
  const collection = db.collection(COLLECTION_NAME);

  console.log('\n🔍 Verifying migration...');

  // Check collection exists
  const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
  if (collections.length === 0) {
    throw new Error('Collection not found after creation');
  }
  console.log(`  ✅ Collection verified: ${COLLECTION_NAME}`);

  // Check indexes exist
  const indexes = await collection.listIndexes().toArray();
  const expectedIndexCount = INDEXES.length + 1; // +1 for default _id index

  if (indexes.length < expectedIndexCount) {
    console.warn(
      `  ⚠️  Warning: Expected ${expectedIndexCount} indexes, found ${indexes.length}`,
    );
  } else {
    console.log(`  ✅ Indexes verified: ${indexes.length} total (including _id)`);
  }

  // Log index details for verification
  console.log('\n📊 Index Details:');
  indexes.forEach((index) => {
    const keyStr = JSON.stringify(index.key);
    const ttl = index.expireAfterSeconds ? ` [TTL: ${index.expireAfterSeconds}s]` : '';
    console.log(`  - ${index.name || 'unnamed'}: ${keyStr}${ttl}`);
  });

  // Check document count
  const documentCount = await collection.countDocuments();
  console.log(`\n📈 Document count: ${documentCount}`);
}

/**
 * Main migration function
 */
async function migrate() {
  validateEnvironment();

  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    console.log('\n🏗️  Creating collection and indexes...\n');

    await createCollection(db);
    await createIndexes(db);

    await verifyMigration(db);

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(SUCCESS_CODE);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(FAILURE_CODE);
  } finally {
    await client.close();
  }
}

// Run migration
migrate();
