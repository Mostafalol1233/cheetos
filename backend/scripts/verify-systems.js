// import fetch from 'node-fetch'; // Built-in in Node 18+

const BASE_URL = 'http://localhost:3001/api';
let userToken = '';
let adminToken = '';
let userId = '';

const run = async () => {
  console.log('Testing Systems...');

  // 1. Register User
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password: 'password123',
        phone: '1234567890'
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Register User Success:', data.user.email);
      userToken = data.token;
      userId = data.user.id;
    } else {
      console.error('❌ Register User Failed:', data);
    }
  } catch (err) { console.error('❌ Register User Error:', err.message); }

  // 2. Create Order
  if (userToken) {
    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          customer_name: 'Test User',
          customer_email: 'test@example.com',
          customer_phone: '1234567890',
          items: [{ id: 'game_1', name: 'Test Game', price: 100 }],
          total_amount: 100,
          payment_method: 'cod'
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Create Order Success:', data.id);
      } else {
        console.error('❌ Create Order Failed:', data);
      }
    } catch (err) { console.error('❌ Create Order Error:', err.message); }
  }

  // 3. Admin Login
  try {
    const res = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@diaaldeen.com',
        password: 'admin123'
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Admin Login Success');
      adminToken = data.token;
    } else {
      console.error('❌ Admin Login Failed:', data);
    }
  } catch (err) { console.error('❌ Admin Login Error:', err.message); }

  // 4. List Orders (Admin)
  if (adminToken) {
    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ List Orders Success: Found ${data.length} orders`);
      } else {
        console.error('❌ List Orders Failed:', data);
      }
    } catch (err) { console.error('❌ List Orders Error:', err.message); }
  }

};

run();
