import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@blissdrive.com' },
    update: {},
    create: {
      email: 'demo@blissdrive.com',
      passwordHash,
      name: 'Demo User',
      role: 'ADMIN',
      settings: {
        create: {
          theme: 'dark',
        },
      },
    },
  });

  console.log('Created demo user:', user.email);

  // Create demo clients
  const client1 = await prisma.client.upsert({
    where: { id: 'demo-client-1' },
    update: {},
    create: {
      id: 'demo-client-1',
      userId: user.id,
      name: 'Infinity Solar',
      domain: 'infinitysolar.com',
      industry: 'Solar Energy',
      location: 'Orange County, CA',
      competitors: ['SunPower OC', 'Vivint Solar', 'Tesla Solar', 'Sunrun'],
      prompts: [
        'best solar company in Orange County',
        'top rated solar installers near me Orange County',
        'who should I hire for solar panel installation in OC',
        'most reliable solar energy company Southern California',
        'best solar battery storage installer Orange County',
      ],
    },
  });

  console.log('Created demo client:', client1.name);

  const client2 = await prisma.client.upsert({
    where: { id: 'demo-client-2' },
    update: {},
    create: {
      id: 'demo-client-2',
      userId: user.id,
      name: 'LS Carlson Law',
      domain: 'lscarlsonlaw.com',
      industry: 'Legal Services',
      location: 'Los Angeles, CA',
      competitors: ['Girardi Keese', 'McNeil Firm', 'The Cochran Firm'],
      prompts: [
        'best HOA attorney in Los Angeles',
        'top consumer protection lawyer California',
        'who is the best lawyer for HOA disputes',
      ],
    },
  });

  console.log('Created demo client:', client2.name);

  console.log('Seeding completed!');
  console.log('\nDemo credentials:');
  console.log('Email: demo@blissdrive.com');
  console.log('Password: demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
