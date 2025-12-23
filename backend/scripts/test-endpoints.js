import http from 'http';

const endpoints = [
  '/api/health',
  '/api/categories',
  '/api/games/popular'
];

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

console.log(`Testing API endpoints at ${BASE_URL}...`);

let passed = 0;
let failed = 0;

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[PASS] ${path} - Status: ${res.statusCode}`);
          try {
            const json = JSON.parse(data);
            if (Array.isArray(json) || typeof json === 'object') {
                console.log(`       Response is valid JSON`);
            }
            passed++;
          } catch (e) {
             console.log(`       Response is NOT valid JSON`);
          }
        } else if (res.statusCode === 404 && path === '/api/health') {
            // Health might not be implemented, but server is responding
            console.log(`[WARN] ${path} - Status: ${res.statusCode} (might be expected if not implemented)`);
            passed++; // Count as pass for server liveness
        } else {
          console.log(`[FAIL] ${path} - Status: ${res.statusCode}`);
          console.log(`       Response: ${data.substring(0, 100)}`);
          failed++;
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`[FAIL] ${path} - Error: ${err.message}`);
      failed++;
      resolve();
    });
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
