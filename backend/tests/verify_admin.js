
const BASE_URL = 'http://127.0.0.1:3001';
const ADMIN_EMAIL = 'admin@diaaldeen.com';
const ADMIN_PASSWORD = "A!dm1n_2025_Diaa_Secure_#42";

async function runTests() {
    console.log('🚀 Starting Backend Verification...\n');

    try {
        // 1. Health Check (via root or simple endpoint)
        // There is no specific health route, but we can try fetching contact info as a public endpoint
        console.log('1. Testing Public Endpoint (Contact Info)...');
        const contactRes = await fetch(`${BASE_URL}/api/contact-info`);
        if (contactRes.ok) {
            console.log('   ✅ Public availability check passed');
        } else {
            console.error('   ❌ Public availability check failed:', contactRes.status);
        }

        // 2. Admin Login
        console.log('\n2. Testing Admin Login...');
        const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            throw new Error(`Login failed with status ${loginRes.status}: ${txt}`);
        }

        const loginData = await loginRes.json();
        console.log('   ✅ Admin Login successful');

        if (!loginData.token) {
            throw new Error('No token received from login');
        }
        const token = loginData.token;
        const csrfToken = loginData.csrfToken;
        console.log('   ℹ️  Token received');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
            'Cookie': `csrf_token=${csrfToken}`
        };

        // 3. Verify Token
        console.log('\n3. Verifying Admin Session...');
        const verifyRes = await fetch(`${BASE_URL}/api/admin/verify`, { headers });
        if (verifyRes.ok) {
            console.log('   ✅ Session verification passed');
        } else {
            console.error('   ❌ Session verification failed:', await verifyRes.text());
        }

        // 4. Fetch Games (Admin Route)
        console.log('\n4. Fetching Games List...');
        const gamesRes = await fetch(`${BASE_URL}/api/games`, { headers }); // Assuming public but good to check
        if (gamesRes.ok) {
            const games = await gamesRes.json();
            console.log(`   ✅ Fetched ${Array.isArray(games) ? games.length : 0} games`);
        } else {
            console.error('   ❌ Failed to fetch games:', gamesRes.status);
        }

        // 5. Check Admin Protected Route (e.g. Chat sessions)
        console.log('\n5. Checking Admin Protected Route (Chat Sessions)...');
        const chatRes = await fetch(`${BASE_URL}/api/admin/chat/sessions`, { headers });
        if (chatRes.ok) {
            console.log('   ✅ Admin protected route access successful');
        } else {
            console.error('   ❌ Admin protected route failed:', chatRes.status, await chatRes.text());
        }

        console.log('\n✨ Verification Complete!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
    }
}

runTests();
