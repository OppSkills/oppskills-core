import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a dummy user
  const user = await prisma.userEntity.upsert({
    where: { email: 'test@oppskills.com' },
    update: {},
    create: {
      email: 'test@oppskills.com',
      firstName: 'Test',
      lastName: 'User',
      accessLevel: 'ADMIN',
    },
  });

  console.log('User created/found:', user.id);

  // Create Hackathons (must be PUBLISHED + APPROVED to show in public API)
  const hackathon1 = await prisma.hackathonEntity.upsert({
    where: { slug: 'global-tech-hackathon-2026' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'Global Tech Hackathon 2026',
      slug: 'global-tech-hackathon-2026',
      description: 'Build innovative solutions to real-world problems in this 48-hour coding marathon.',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-17'),
      mode: 'ONLINE',
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'OppSkills',
      hackathonType: 'CODING_HACKATHON',
      isFree: true,
      visibility: 'PUBLIC',
      registrationDeadline: new Date('2026-06-10'),
    },
  });
  console.log('Hackathon created:', hackathon1.slug);

  const hackathon2 = await prisma.hackathonEntity.upsert({
    where: { slug: 'ai-innovation-challenge' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'AI Innovation Challenge',
      slug: 'ai-innovation-challenge',
      description: 'Push the boundaries of artificial intelligence in this week-long hackathon.',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-07'),
      mode: 'HYBRID',
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'TechForge Labs',
      hackathonType: 'OPEN_HACKATHON',
      isFree: false,
      entryFeeAmount: 500,
      currency: 'INR',
      prizeTotalWorthAmount: 100000,
      visibility: 'PUBLIC',
      registrationDeadline: new Date('2026-06-25'),
    },
  });
  console.log('Hackathon created:', hackathon2.slug);

  // Create a Competition (CASE_STUDY_COMPETITION type hackathon)
  const competition = await prisma.hackathonEntity.upsert({
    where: { slug: 'business-case-study-2026' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'Business Case Study 2026',
      slug: 'business-case-study-2026',
      description: 'Solve real-world business problems and present your strategy to industry leaders.',
      startDate: new Date('2026-06-20'),
      endDate: new Date('2026-07-04'),
      mode: 'ONLINE',
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'OppSkills Business',
      hackathonType: 'CASE_STUDY_COMPETITION',
      isFree: true,
      visibility: 'PUBLIC',
      registrationDeadline: new Date('2026-06-15'),
    },
  });
  console.log('Competition created:', competition.slug);

  // Create Events (must be PUBLISHED + APPROVED)
  const event1 = await prisma.eventEntity.upsert({
    where: { slug: 'ai-workshop-2026' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'AI in 2026 Workshop',
      slug: 'ai-workshop-2026',
      description: 'Hands-on workshop exploring the latest AI tools and frameworks.',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-11'),
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'OppSkills Labs',
      eventType: 'WORKSHOP',
      isFree: true,
      visibility: 'PUBLIC',
      locationType: 'VIRTUAL',
    },
  });
  console.log('Event created:', event1.slug);

  const event2 = await prisma.eventEntity.upsert({
    where: { slug: 'startup-networking-meetup' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'Startup Networking Meetup',
      slug: 'startup-networking-meetup',
      description: 'Connect with founders, investors, and startup enthusiasts in Bangalore.',
      startDate: new Date('2026-06-25'),
      endDate: new Date('2026-06-25'),
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'Founders Club',
      eventType: 'NETWORKING',
      isFree: true,
      visibility: 'PUBLIC',
      locationType: 'PHYSICAL',
      locationCity: 'Bangalore',
      locationAddress: 'Koramangala, Bangalore',
    },
  });
  console.log('Event created:', event2.slug);

  const event3 = await prisma.eventEntity.upsert({
    where: { slug: 'web3-conference-2026' },
    update: { approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    create: {
      name: 'Web3 Developer Conference',
      slug: 'web3-conference-2026',
      description: 'Deep dive into blockchain, DeFi, and decentralized application development.',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-16'),
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      ownerId: user.id,
      organizationName: 'Chain Builders',
      eventType: 'CONFERENCE',
      isFree: false,
      entryFeeAmount: 999,
      currency: 'INR',
      visibility: 'PUBLIC',
      locationType: 'PHYSICAL',
      locationCity: 'Mumbai',
      locationAddress: 'BKC Convention Centre, Mumbai',
    },
  });
  console.log('Event created:', event3.slug);

  // Also update the old test records if they exist (from previous seed)
  await prisma.hackathonEntity.updateMany({
    where: { slug: { in: ['test-hackathon', 'test-competition'] } },
    data: { approvalStatus: 'APPROVED' },
  });
  await prisma.eventEntity.updateMany({
    where: { slug: 'test-event' },
    data: { approvalStatus: 'APPROVED' },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
