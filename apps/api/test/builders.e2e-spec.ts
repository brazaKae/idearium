import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, registerUser } from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Builders (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /builders/me', () => {
    it('cria BuilderProfile (upsert)', async () => {
      const user = await registerUser(app, { username: 'mari' });

      const res = await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(user.accessToken))
        .send({
          headline: 'front + ilustração · procura cultura',
          topics: ['cultura', 'educacao'],
          isOpenToWork: true,
        })
        .expect(200);

      expect(res.body).toMatchObject({
        headline: 'front + ilustração · procura cultura',
        topics: ['cultura', 'educacao'],
        isOpenToWork: true,
      });
      expect(res.body.user).toMatchObject({ username: 'mari' });
    });

    it('atualiza BuilderProfile existente (upsert)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(user.accessToken))
        .send({ headline: 'v1', topics: ['a'] })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(user.accessToken))
        .send({ headline: 'v2', topics: ['b', 'c'], isOpenToWork: false })
        .expect(200);

      expect(res.body).toMatchObject({
        headline: 'v2',
        topics: ['b', 'c'],
        isOpenToWork: false,
      });
    });

    it('rejeita topics > 10 itens (400)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(user.accessToken))
        .send({ topics: Array(11).fill('x') })
        .expect(400);
    });

    it('rejeita sem token (401)', async () => {
      await request(app.getHttpServer()).patch('/builders/me').send({}).expect(401);
    });
  });

  describe('GET /builders', () => {
    it('lista builders com paginação default', async () => {
      const u1 = await registerUser(app, { username: 'mari' });
      const u2 = await registerUser(app, { username: 'rafa' });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u1.accessToken))
        .send({ headline: 'A', topics: ['cultura'], isOpenToWork: true });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u2.accessToken))
        .send({ headline: 'B', topics: ['cidades'], isOpenToWork: true });

      const res = await request(app.getHttpServer()).get('/builders').expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });

    it('filtra por topic', async () => {
      const u1 = await registerUser(app, { username: 'mari' });
      const u2 = await registerUser(app, { username: 'rafa' });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u1.accessToken))
        .send({ headline: 'A', topics: ['cultura'] });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u2.accessToken))
        .send({ headline: 'B', topics: ['cidades'] });

      const res = await request(app.getHttpServer())
        .get('/builders?topic=cultura')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].user.username).toBe('mari');
    });

    it('filtra por isOpenToWork=false', async () => {
      const u1 = await registerUser(app, { username: 'mari' });
      const u2 = await registerUser(app, { username: 'rafa' });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u1.accessToken))
        .send({ headline: 'A', isOpenToWork: true });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u2.accessToken))
        .send({ headline: 'B', isOpenToWork: false });

      const res = await request(app.getHttpServer())
        .get('/builders?isOpenToWork=false')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].user.username).toBe('rafa');
    });

    it('paginação com limit=1', async () => {
      const u1 = await registerUser(app, { username: 'mari' });
      const u2 = await registerUser(app, { username: 'rafa' });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u1.accessToken))
        .send({ headline: 'A' });
      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(u2.accessToken))
        .send({ headline: 'B' });

      const res = await request(app.getHttpServer())
        .get('/builders?page=1&limit=1')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    });
  });

  describe('GET /builders/:username', () => {
    it('retorna BuilderProfile específico', async () => {
      const user = await registerUser(app, { username: 'mari' });

      await request(app.getHttpServer())
        .patch('/builders/me')
        .set(authHeader(user.accessToken))
        .send({ headline: 'olá', topics: ['cultura'] });

      const res = await request(app.getHttpServer()).get('/builders/mari').expect(200);

      expect(res.body.headline).toBe('olá');
      expect(res.body.user.username).toBe('mari');
    });

    it('retorna 404 se user não tem BuilderProfile', async () => {
      await registerUser(app, { username: 'sem-perfil' });

      await request(app.getHttpServer()).get('/builders/sem-perfil').expect(404);
    });
  });
});
