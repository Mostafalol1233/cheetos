
import fetch from 'node-fetch';

// Try 20242 first, then 3001
const PORTS = [20242, 3001];
const ADMIN_EMAIL = 'admin@diaaldeen.com';
const ADMIN_PASSWORD = 'A!dm1n_2025_Diaa_Secure_#42';

async function run() {
  console.log('Testing Header API Endpoints...');

  let baseUrl = '';
  let token = '';
  
  // 1. Find active port and login
  for (const port of PORTS) {
    try {
      console.log(`Trying login on port ${port}...`);
      const res = await fetch(`http://localhost:${port}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      });
      
      if (res.ok) {
        const data = await res.json();
        token = data.token;
        baseUrl = `http://localhost:${port}/api`;
        console.log(`✅ Login successful on port ${port}. Token obtained.`);
        break;
      } else {
        console.log(`❌ Login failed on port ${port}: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.log(`❌ Connection failed on port ${port}: ${err.message}`);
    }
  }

  if (!baseUrl) {
    console.error('❌ Could not connect to any port.');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  let versionId = '';

  // 2. Save Version
  try {
    console.log('Saving new header version...');
    const res = await fetch(`${baseUrl}/header-images/save-version`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageUrl: '/uploads/test-header.jpg',
        headingText: 'Test Heading',
        buttonText: 'Test Button',
        buttonUrl: '/test',
        isActive: false
      })
    });
    
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    const data = await res.json();
    versionId = data.id;
    console.log(`✅ Version saved. ID: ${versionId}`);
  } catch (err) {
    console.error('❌ Save version error:', err.message);
  }

  // 3. Get Versions
  try {
    console.log('Fetching versions...');
    const res = await fetch(`${baseUrl}/header-images/versions`, { headers });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const data = await res.json();
    const found = data.find(v => v.id === versionId);
    if (found) console.log('✅ Created version found in list.');
    else console.error('❌ Created version NOT found in list.');
  } catch (err) {
    console.error('❌ Fetch versions error:', err.message);
  }

  // 4. Activate Version
  try {
    console.log('Activating version...');
    const res = await fetch(`${baseUrl}/header-images/versions/${versionId}/activate`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error(`Activate failed: ${res.status}`);
    console.log('✅ Version activated.');
    
    // Verify settings updated
    const settingsRes = await fetch(`${baseUrl}/settings`); // Public endpoint
    const settings = await settingsRes.json();
    // Check both potential field names (camelCase vs snake_case depending on API response format)
    const imgUrl = settings.headerImageUrl || settings.header_image_url;
    
    if (imgUrl === '/uploads/test-header.jpg') {
        console.log('✅ Settings updated with active version.');
    } else {
        console.error(`❌ Settings NOT updated. Got: ${imgUrl}`);
    }

  } catch (err) {
    console.error('❌ Activate version error:', err.message);
  }

  // 5. Delete (Archive) Version
  try {
    console.log('Archiving version...');
    const res = await fetch(`${baseUrl}/header-images/versions/${versionId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
    console.log('✅ Version archived.');
  } catch (err) {
    console.error('❌ Archive version error:', err.message);
  }

  // 6. Get Archived
  try {
    console.log('Fetching archived versions...');
    const res = await fetch(`${baseUrl}/header-images/versions/archived`, { headers });
    if (!res.ok) throw new Error(`Fetch archived failed: ${res.status}`);
    const data = await res.json();
    const found = data.find(v => v.id === versionId);
    if (found) console.log('✅ Archived version found in list.');
    else console.error('❌ Archived version NOT found in list.');
  } catch (err) {
    console.error('❌ Fetch archived error:', err.message);
  }

  // 7. Recover Version
  try {
    console.log('Recovering version...');
    const res = await fetch(`${baseUrl}/header-images/versions/${versionId}/recover`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error(`Recover failed: ${res.status}`);
    console.log('✅ Version recovered.');
  } catch (err) {
    console.error('❌ Recover version error:', err.message);
  }

  console.log('Test complete.');
}

run();
