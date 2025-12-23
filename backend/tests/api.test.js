const request = require('supertest');
const baseURL = 'http://localhost:3001';

describe('GameCart API Endpoints', () => {
  
  test('GET /api/categories should return 200 and an array', async () => {
    const response = await request(baseURL).get('/api/categories');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    }
  });

  test('GET /api/games/popular should return 200 and an array', async () => {
    const response = await request(baseURL).get('/api/games/popular');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('isPopular', true);
    }
  });

  test('GET /api/health should return 200 (if exists) or 404', async () => {
      // Checking if health endpoint exists or we handle it gracefully
      const response = await request(baseURL).get('/api/health');
      if (response.status !== 404) {
          expect(response.status).toBe(200);
      }
  });

});
