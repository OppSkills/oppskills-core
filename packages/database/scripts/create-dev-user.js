#!/usr/bin/env node
// Simple script to create/upsert a dev user in the database using Prisma
// Usage:
//   node ./scripts/create-dev-user.js you@example.com "First" "Last"
// Or set EMAIL/FIRST_NAME/LAST_NAME env vars and run the script.

const { PrismaClient } = require('@prisma/client');

const email = process.argv[2] || process.env.EMAIL;
const firstName = process.argv[3] || process.env.FIRST_NAME || null;
const lastName = process.argv[4] || process.env.LAST_NAME || null;

if (!email) {
  console.error('Usage: node create-dev-user.js you@example.com [FirstName] [LastName]');
  process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
      },
      create: {
        email,
        firstName,
        lastName,
      },
    });

    console.log('Dev user created/upserted:');
    console.log('  id:   ', user.id);
    console.log('  email:', user.email);
    console.log('\nUse this ID with the dev auth bypass header:');
    console.log('  x-user-id: ' + user.id);
    console.log('\nExample curl (dev only):');
    console.log("  curl -H \"x-user-id: " + user.id + "\" http://localhost:3001/your/api/path");
  } catch (err) {
    console.error('Error creating user:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
