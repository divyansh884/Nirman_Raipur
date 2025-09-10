const request = require('supertest');
const express = require('express');
const workProgressRoutes = require('../routes/workProgressRoutes');

const app = express();
app.use(express.json());
app.use('/api/work-proposals', workProgressRoutes);

describe('Work Progress Routes', () => {
  const dummyId = '123';

  test('POST /:id/progress - should update work progress', async () => {
    const res = await request(app)
      .post(`/api/work-proposals/${dummyId}/progress`)
      .send({ progressPercentage: 50 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Work progress updated');
  });

  test('POST /:id/progress/installment - should add installment', async () => {
    const res = await request(app)
      .post(`/api/work-proposals/${dummyId}/progress/installment`)
      .send({ amount: 1000, date: '2025-08-24' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Installment added');
  });

  test('POST /:id/progress/complete - should complete work', async () => {
    const res = await request(app)
      .post(`/api/work-proposals/${dummyId}/progress/complete`)
      .send({ finalExpenditureAmount: 15000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Work completed');
  });

  test('GET /:id/progress/history - should return progress history', async () => {
    const res = await request(app).get(`/api/work-proposals/${dummyId}/progress/history`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('History fetched');
  });

  test('GET /api/work-progress - should return all progress', async () => {
    const res = await request(app).get('/api/work-proposals/');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All progress data');
  });
});
