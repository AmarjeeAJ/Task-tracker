import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { Task } from '../src/models/Task';

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe('POST /tasks — invalid task creation', () => {
  it('rejects an empty title with a field-level error and stores nothing', async () => {
    const res = await request(app).post('/tasks').send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details).toContainEqual({ field: 'title', message: 'Title is required' });
    expect(await Task.countDocuments()).toBe(0);
  });

  it('rejects a title longer than 100 characters and invalid enum values', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'a'.repeat(101), status: 'archived', priority: 'urgent' });

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'status', 'priority']));
    expect(await Task.countDocuments()).toBe(0);
  });
});

describe('PATCH /tasks/:id — status update', () => {
  it('updates the status and persists it', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Write report', priority: 'high' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('todo');

    const res = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: 'Write report', status: 'done' });

    const stored = await Task.findById(created.body.id).lean();
    expect(stored?.status).toBe('done');
  });

  it('returns 400 for an invalid id or status and 404 for a missing task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Task' });

    const badId = await request(app).patch('/tasks/not-an-id').send({ status: 'done' });
    expect(badId.status).toBe(400);

    const badStatus = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'finished' });
    expect(badStatus.status).toBe(400);

    const extraField = await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done', title: 'x' });
    expect(extraField.status).toBe(400);

    const missing = await request(app)
      .patch(`/tasks/${new mongoose.Types.ObjectId().toString()}`)
      .send({ status: 'done' });
    expect(missing.status).toBe(404);

    const stored = await Task.findById(created.body.id).lean();
    expect(stored).toMatchObject({ title: 'Task', status: 'todo' });
  });
});

describe('GET /tasks', () => {
  it('lists tasks newest first and filters by status', async () => {
    await Task.create({ title: 'First', createdAt: new Date('2026-01-01') });
    await Task.create({ title: 'Second', status: 'done', createdAt: new Date('2026-01-02') });

    const all = await request(app).get('/tasks');
    expect(all.status).toBe(200);
    expect(all.body.map((t: { title: string }) => t.title)).toEqual(['Second', 'First']);

    const done = await request(app).get('/tasks?status=done');
    expect(done.body).toHaveLength(1);
    expect(done.body[0].title).toBe('Second');

    const inProgress = await request(app).get('/tasks?status=in_progress');
    expect(inProgress.body).toEqual([]);

    const invalid = await request(app).get('/tasks?status=bogus');
    expect(invalid.status).toBe(400);
  });
});

describe('DELETE /tasks/:id', () => {
  it('deletes an existing task and returns 404 afterwards', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Disposable' });

    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(await Task.countDocuments()).toBe(0);

    const again = await request(app).delete(`/tasks/${created.body.id}`);
    expect(again.status).toBe(404);
  });
});
