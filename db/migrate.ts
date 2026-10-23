import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from './index';

async function runMigrations() {
  console.info('Running migrations...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.info('Migrations completed successfully!');
}

runMigrations()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
