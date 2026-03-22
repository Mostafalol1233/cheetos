import http from 'http';

function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`GET ${path} - Status: ${res.statusCode}`);
        if (res.statusCode >= 400) {
          console.log('Body:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request to ${path}: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function run() {
  console.log('Checking APIs...');
  await checkEndpoint('/api/categories');
  await checkEndpoint('/api/games');
}

run();
