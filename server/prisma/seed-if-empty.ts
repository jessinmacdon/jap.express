// Runs before every deploy (see railway.json). Loads the demo data only when the
// database has no users yet, or when RESEED_DEMO=true (wipes and reloads it).
import { execFileSync } from 'node:child_process';
import { prisma } from '../src/db.ts';

const users = await prisma.user.count();
await prisma.$disconnect();
if (users === 0 || process.env.RESEED_DEMO === 'true') {
  console.info(users === 0 ? 'Empty database: loading demo data.' : 'RESEED_DEMO=true: reloading demo data.');
  execFileSync('npx', ['tsx', 'prisma/seed.ts'], { stdio: 'inherit' });
} else {
  console.info(`Database has ${users} users: leaving data as is.`);
}
