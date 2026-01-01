const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('🧪 Starting Metrics & API Edge Case Tests...');

  // 1. Test Metrics Endpoint
  console.log('\n1️⃣ Testing /api/metrics/interaction...');
  try {
    const res = await fetch(`${BASE_URL}/metrics/interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'click',
        element: 'test_button',
        page: '/test',
        success: true,
        ua: 'TestScript/1.0'
      })
    });
    
    if (res.ok) {
      console.log('✅ Metrics POST successful');
    } else {
      console.log(`❌ Metrics POST failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log('   Response:', text);
    }
  } catch (err) {
    console.log(`❌ Metrics POST error: ${err.message}`);
  }

  // 2. Test Edge Case Game Slugs (crossfire:1)
  console.log('\n2️⃣ Testing Edge Case Slugs (crossfire:1)...');
  const edgeCases = ['crossfire:1', 'roblox:1'];
  
  for (const slug of edgeCases) {
    try {
      console.log(`   Requesting /games/${slug}...`);
      const res = await fetch(`${BASE_URL}/games/${slug}`);
      
      if (res.status === 500) {
        console.log(`❌ Failed: 500 Server Error for ${slug}`);
      } else if (res.ok) {
        const data = await res.json();
        console.log(`✅ Success: ${res.status} (Returned game: ${data.name})`);
      } else if (res.status === 404) {
        console.log(`✅ Success: 404 Not Found (Correctly handled)`);
      } else {
        console.log(`⚠️  Unexpected status: ${res.status}`);
      }
    } catch (err) {
      console.log(`❌ Request error for ${slug}: ${err.message}`);
    }
  }

  console.log('\n🏁 Tests Completed');
}

runTests();
