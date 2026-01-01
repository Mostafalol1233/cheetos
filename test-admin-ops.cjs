
const assert = require('assert');

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@diaasadek.com';
const ADMIN_PASSWORD = 'A!dm1n_2025_Diaa_Secure_#42';

async function runTests() {
  console.log('🚀 Starting Admin Panel Tests...');

  let token;
  let gameId;

  // Helper for fetch
  const api = async (endpoint, method = 'GET', body = null, headers = {}) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${endpoint}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(`Request failed: ${res.status} ${JSON.stringify(data)}`);
        error.response = { status: res.status, data };
        throw error;
    }
    return data;
  };

  // 1. Test Login
  try {
    console.log('1️⃣ Testing Admin Login...');
    const data = await api('/admin/login', 'POST', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = data.token;
    console.log('✅ Login successful, token received.');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    process.exit(1);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Test Create Game
  try {
    console.log('2️⃣ Testing Create Game...');
    const newGame = {
      name: 'Test Game Admin',
      description: 'Created via automated test',
      price: 100,
      currency: 'EGP',
      category: 'action',
      isPopular: false,
      stock: 50,
      packages: ['100 Points'],
      packagePrices: [100],
      packageDiscountPrices: [null]
    };

    const data = await api('/admin/games', 'POST', newGame, authHeaders);
    gameId = data.id;
    console.log(`✅ Game created with ID: ${gameId}`);
  } catch (err) {
    console.error('❌ Create Game failed:', err.message);
    process.exit(1);
  }

  // 3. Test Update Game
  try {
    console.log('3️⃣ Testing Update Game...');
    const data = await api(`/admin/games/${gameId}`, 'PUT', {
      name: 'Test Game Admin Updated',
      price: 150
    }, authHeaders);
    
    assert.strictEqual(data.name, 'Test Game Admin Updated');
    assert.strictEqual(Number(data.price), 150);
    console.log('✅ Game updated successfully.');
  } catch (err) {
    console.error('❌ Update Game failed:', err.message);
  }

  // 4. Test Delete Game
  try {
    console.log('4️⃣ Testing Delete Game...');
    await api(`/admin/games/${gameId}`, 'DELETE', null, authHeaders);
    console.log('✅ Game deleted successfully.');
  } catch (err) {
    console.error('❌ Delete Game failed:', err.message);
  }

  // 5. Test Access Control (Delete without token)
  try {
    console.log('5️⃣ Testing Access Control...');
    try {
      await api(`/admin/games/some_id`, 'DELETE');
      console.error('❌ Access Control failed: Request should have been unauthorized.');
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log('✅ Access Control passed: Unauthorized request blocked.');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('❌ Access Control test error:', err.message);
  }

  console.log('🎉 All Admin Tests Completed!');
}

runTests();
