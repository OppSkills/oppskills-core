/**
 * Helper script to validate Google Sheets configuration
 * Run with: pnpm ts-node -r tsconfig-paths/register src/google-sheets/validate-config.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../../.env.local') });

const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

console.log('🔍 Validating Google Sheets Configuration\n');

let hasErrors = false;

// Validate Client Email
console.log('1. Checking GOOGLE_SHEETS_CLIENT_EMAIL...');
if (!clientEmail) {
  console.log('   ❌ Not set');
  hasErrors = true;
} else if (clientEmail.includes('.iam.gserviceaccount.com')) {
  console.log('   ✅ Valid service account email:', clientEmail);
} else if (clientEmail.includes('.apps.googleusercontent.com')) {
  console.log('   ❌ This is an OAuth client ID, not a service account email');
  console.log('   💡 You need a service account email ending with .iam.gserviceaccount.com');
  hasErrors = true;
} else {
  console.log('   ⚠️  Unexpected format:', clientEmail);
  hasErrors = true;
}

// Validate Private Key
console.log('\n2. Checking GOOGLE_SHEETS_PRIVATE_KEY...');
if (!privateKey) {
  console.log('   ❌ Not set');
  hasErrors = true;
} else if (privateKey.includes('BEGIN PRIVATE KEY')) {
  const keyLength = privateKey.replace(/\\n/g, '').replace(/\s/g, '').length;
  console.log('   ✅ Valid private key format (length:', keyLength, 'chars)');
} else if (privateKey.startsWith('GOCSPX-')) {
  console.log('   ❌ This is an OAuth client secret, not a service account private key');
  console.log(
    '   💡 You need a private key that starts with -----BEGIN PRIVATE KEY-----',
  );
  hasErrors = true;
} else {
  console.log('   ❌ Invalid private key format');
  console.log(
    '   💡 Should start with -----BEGIN PRIVATE KEY----- and end with -----END PRIVATE KEY-----',
  );
  hasErrors = true;
}

// Validate Spreadsheet ID
console.log('\n3. Checking GOOGLE_SHEETS_SPREADSHEET_ID...');
if (!spreadsheetId) {
  console.log('   ❌ Not set');
  hasErrors = true;
} else if (spreadsheetId.match(/^[a-zA-Z0-9_-]{20,}$/)) {
  console.log('   ✅ Valid spreadsheet ID:', spreadsheetId);
} else {
  console.log('   ⚠️  Possibly invalid format:', spreadsheetId);
  console.log(
    '   💡 Should be the ID from the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit',
  );
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ Configuration has errors. Please fix them and try again.');
  console.log('\n📖 See GOOGLE_SHEETS_SETUP.md for detailed setup instructions.');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good!');
  console.log(
    '\n⚠️  Remember to share your spreadsheet with the service account email:',
  );
  console.log('   ', clientEmail);
  console.log(
    '\n🧪 Test the connection with: curl http://localhost:3001/google-sheets/status',
  );
  process.exit(0);
}
