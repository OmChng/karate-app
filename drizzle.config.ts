import { config as loadDotenv } from 'dotenv';
loadDotenv({ path: '.env.local' });
loadDotenv();
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
