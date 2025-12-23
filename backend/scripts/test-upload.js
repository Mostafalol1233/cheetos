import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@diaaldeen.com',
      password: 'admin123'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            if (parsed.token) {
              resolve(parsed.token);
            } else {
              reject(`No token in response: ${body}`);
            }
          } catch (e) {
            reject(`Invalid JSON: ${body}`);
          }
        } else {
          reject(`Login failed: ${res.statusCode} ${body}`);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function upload(token) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'test-upload.txt');
    const fileContent = fs.readFileSync(filePath);
    const fileName = 'test-upload.txt';

    let postData = '';
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    postData += 'Content-Type: text/plain\r\n\r\n';
    
    const header = Buffer.from(postData, 'utf8');
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([header, fileContent, footer]);

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(resBody));
          } catch (e) {
            resolve(resBody);
          }
        } else {
          reject(`Upload failed: ${res.statusCode} ${resBody}`);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in...');
    const token = await login();
    console.log('Token received.');
    
    console.log('Uploading file...');
    const result = await upload(token);
    console.log('Upload successful:', result);
  } catch (err) {
    console.error(err);
  }
}

run();