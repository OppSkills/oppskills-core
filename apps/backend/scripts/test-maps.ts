import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve the path to .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const apiKey = process.env.GOOGLE_MAP_API;

console.log('--- Google Places API Autocomplete Test ---');
console.log(`Loading env from: ${envPath}`);

if (!apiKey) {
  console.error('Error: GOOGLE_MAP_API environment variable is not defined in .env.local.');
  process.exit(1);
}

const maskedKey = apiKey.length > 8 
  ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` 
  : '***';
console.log(`API Key detected: ${maskedKey}`);

const query = 'GCET';

async function testPlacesNewApi() {
  console.log(`\n--- [1] Testing Places API (New) Autocomplete ---`);
  const url = 'https://places.googleapis.com/v1/places:autocomplete';
  console.log(`Querying: "${query}" via POST to ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey!,
      },
      body: JSON.stringify({ input: query }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error(`❌ HTTP Error! Status: ${response.status}`);
      console.log('Error Details:', JSON.stringify(data, null, 2));
      return false;
    }

    if (data.suggestions && data.suggestions.length > 0) {
      console.log('✅ Success! Suggestions found:\n');
      data.suggestions.forEach((item: any, index: number) => {
        const pred = item.placePrediction;
        if (pred) {
          console.log(`[${index + 1}] ${pred.text?.text || pred.structuredFormat?.mainText?.text}`);
          console.log(`    Place ID: ${pred.placeId}`);
          if (pred.types) {
            console.log(`    Types: ${pred.types.join(', ')}`);
          }
          console.log('');
        }
      });
      return true;
    } else {
      console.log('ℹ️ No suggestions returned.');
      console.log('Full Response Data:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message || error);
    return false;
  }
}

async function testLegacyPlacesApi() {
  console.log(`\n--- [2] Testing Legacy Places API Autocomplete ---`);
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}`;
  console.log(`Querying: "${query}" via GET to ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json() as any;

    if (!response.ok) {
      console.error(`❌ HTTP Error! Status: ${response.status}`);
      return false;
    }

    if (data.status === 'OK') {
      console.log('✅ Success! Suggestions found:\n');
      data.predictions.forEach((prediction: any, index: number) => {
        console.log(`[${index + 1}] ${prediction.description}`);
        console.log(`    Place ID: ${prediction.place_id}`);
        console.log('');
      });
      return true;
    } else {
      console.error(`❌ Google API Error! Status: ${data.status}`);
      if (data.error_message) {
        console.error(`Message: ${data.error_message}`);
      }
      return false;
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message || error);
    return false;
  }
}

async function testGeocodingApi() {
  console.log(`\n--- [3] Testing Geocoding API ---`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  console.log(`Querying: "${query}" via GET to ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json() as any;

    if (!response.ok) {
      console.error(`❌ HTTP Error! Status: ${response.status}`);
      return false;
    }

    if (data.status === 'OK') {
      console.log('✅ Success! Geocoding result found:\n');
      data.results.forEach((result: any, index: number) => {
        console.log(`[${index + 1}] ${result.formatted_address}`);
        console.log(`    Location: Lat ${result.geometry?.location?.lat}, Lng ${result.geometry?.location?.lng}`);
        console.log(`    Place ID: ${result.place_id}`);
        console.log('');
      });
      return true;
    } else {
      console.error(`❌ Google API Error! Status: ${data.status}`);
      if (data.error_message) {
        console.error(`Message: ${data.error_message}`);
      }
      return false;
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message || error);
    return false;
  }
}

async function runTests() {
  console.log('Running diagnostics suite...');
  const pNew = await testPlacesNewApi();
  const pLegacy = await testLegacyPlacesApi();
  const geocode = await testGeocodingApi();
  
  console.log('\n--- Diagnostics Summary ---');
  console.log(`Places API (New):    ${pNew ? '✅ WORKED' : '❌ FAILED'}`);
  console.log(`Places API (Legacy): ${pLegacy ? '✅ WORKED' : '❌ FAILED'}`);
  console.log(`Geocoding API:       ${geocode ? '✅ WORKED' : '❌ FAILED'}`);
}

runTests();
