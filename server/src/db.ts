import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

// Only DATABASE_URL is needed here, so deploy scripts (migrations, seeding) can run
// without the server's other settings.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. On Railway: service → Variables → DATABASE_URL=${{Postgres.DATABASE_URL}}');

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

export type Db = typeof prisma;
