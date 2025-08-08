import 'dotenv/config';
import ws from 'ws';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const isNeon = /neon\.tech/i.test(process.env.DATABASE_URL);

export let db: ReturnType<typeof import('drizzle-orm/neon-serverless').drizzle> | ReturnType<typeof import('drizzle-orm/node-postgres').drizzle>;

if (isNeon) {
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
    const { Pool } = (await import('pg')).default;
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

