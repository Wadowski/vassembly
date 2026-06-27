import { mongoDb } from '@vassembly/client-mongodb/src/connection.js';

const GRANDFATHERED_COMPLETED_AT = new Date('2026-06-27T00:00:00.000Z');

export const migrateOnboarding = async (): Promise<{ modifiedCount: number }> => {
  const collection = mongoDb.db.collection('users');
  const result = await collection.updateMany(
    { onboarding: { $exists: false } },
    {
      $set: {
        onboarding: {
          version: 1,
          completedAt: GRANDFATHERED_COMPLETED_AT,
        },
      },
    },
  );

  return { modifiedCount: result.modifiedCount };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateOnboarding()
    .then(({ modifiedCount }) => {
      console.log(`Migrated ${modifiedCount} users`);
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
