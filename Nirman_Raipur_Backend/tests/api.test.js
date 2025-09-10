const request = require('supertest');
const app = require('../server');

describe('API Health Check', () => {
  test('GET /health should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });
});

describe('API Base Routes', () => {
  test('GET /api/v1/work-progress should return work progress data', async () => {
    const response = await request(app)
      .get('/api/v1/work-progress')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/v1/work-orders should return work orders data', async () => {
    const response = await request(app)
      .get('/api/v1/work-orders')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
  });

  test('GET /api/v1/tenders should return tenders data', async () => {
    const response = await request(app)
      .get('/api/v1/tenders')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
  });
});

describe('Error Handling', () => {
  test('GET /api/v1/nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/v1/work-progress/invalid-id should return 400', async () => {
    const response = await request(app)
      .get('/api/v1/work-progress/invalid-id')
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });
});
