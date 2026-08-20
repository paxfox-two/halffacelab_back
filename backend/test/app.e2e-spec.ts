import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

// End-to-end smoke test covering the full MVP happy path against a real
// database: register -> login -> create trial -> start it -> submit a
// measurement -> request the analysis report. Exercises the business
// rules (28-day minimum, one RUNNING trial per user, one measurement per
// day) that live in the DB constraints, not just the service layer.
describe('Halfface Lab API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let trialId: string;
  const email = `e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health -> 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('registers a user and returns a JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'testpass123', nickname: 'e2e' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    token = res.body.accessToken;
  });

  it('rejects unauthenticated access to protected routes', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/trials');
    expect(res.status).toBe(401);
  });

  it('rejects a trial shorter than 28 days', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/trials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'too short',
        primaryMetricId: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-10',
      });
    expect(res.status).toBe(400);
  });

  it('creates a trial with randomized left/right arms', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/trials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'e2e trial',
        primaryMetricId: 1,
        startDate: '2026-09-01',
        endDate: '2026-09-29',
      });
    expect(res.status).toBe(201);
    expect(res.body.arms).toHaveLength(2);
    const sides = res.body.arms.map((a: { side: string }) => a.side).sort();
    expect(sides).toEqual(['LEFT', 'RIGHT']);
    trialId = res.body.id;
  });

  it('blocks a measurement before the trial is RUNNING', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/trials/${trialId}/measurements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dayIndex: 0,
        capturedAt: new Date().toISOString(),
        metrics: [{ metricId: 1, side: 'LEFT', value: 10 }],
      });
    expect(res.status).toBe(400);
  });

  it('transitions the trial to RUNNING', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/trials/${trialId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'RUNNING' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RUNNING');
  });

  it('submits a measurement and rejects a second one on the same day', async () => {
    const first = await request(app.getHttpServer())
      .post(`/api/v1/trials/${trialId}/measurements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dayIndex: 0,
        capturedAt: new Date().toISOString(),
        metrics: [
          { metricId: 1, side: 'LEFT', value: 12.3 },
          { metricId: 1, side: 'RIGHT', value: 10.1 },
        ],
      });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post(`/api/v1/trials/${trialId}/measurements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dayIndex: 0,
        capturedAt: new Date().toISOString(),
        metrics: [{ metricId: 1, side: 'LEFT', value: 1 }],
      });
    expect(second.status).toBe(409);
  });

  it('computes a report synchronously and exposes it via the trial report endpoint', async () => {
    const generate = await request(app.getHttpServer())
      .post(`/api/v1/trials/${trialId}/report/generate`)
      .set('Authorization', `Bearer ${token}`);
    expect(generate.status).toBe(201);
    expect(generate.body.status).toBe('DONE');
    expect(generate.body.results).toHaveLength(1);
    expect(generate.body.results[0].nObservations).toBeGreaterThan(0);

    const report = await request(app.getHttpServer())
      .get(`/api/v1/trials/${trialId}/report`)
      .set('Authorization', `Bearer ${token}`);
    expect(report.status).toBe(200);
    expect(report.body.status).toBe('DONE');
  });
});
