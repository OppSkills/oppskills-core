import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve the path to .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

async function verifyEndpoint() {
  console.log('--- Testing Recommendation Location Autocomplete Endpoint ---');
  const url = 'http://localhost:3001/recommendation/location/autocomplete?q=GCET';
  console.log(`Sending GET request to: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'x-user-id': 'dev-user-id',
        'x-user-email': 'dev-user@test.com',
      },
    });

    const data = await response.json() as any;
    console.log(`HTTP Status: ${response.status}`);
    console.log('Response Headers (Rate-Limit info):');
    console.log(`  X-RateLimit-Limit: ${response.headers.get('X-RateLimit-Limit')}`);
    console.log(`  X-RateLimit-Remaining: ${response.headers.get('X-RateLimit-Remaining')}`);
    console.log(`  X-RateLimit-Reset: ${response.headers.get('X-RateLimit-Reset')}`);

    if (response.ok) {
      console.log('✅ Suggestions retrieved successfully:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error response from endpoint:', data);
    }
  } catch (error: any) {
    console.error('❌ Fetch failed:', error.message || error);
  }
}

verifyEndpoint();
