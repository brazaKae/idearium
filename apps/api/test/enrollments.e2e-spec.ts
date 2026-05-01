import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createPublishedRfc,
  createDraftRfc,
  registerUser,
} from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Enrollments (e2e)', () => {
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

  describe('POST /rfcs/:id/enroll', () => {
    it('inscreve builder e bumpa RFC para IN_BUILDING', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .send({ message: 'tenho experiência com Node' })
        .expect(201);

      expect(res.body).toMatchObject({
        role: 'BUILDER',
        message: 'tenho experiência com Node',
        leftAt: null,
      });
      expect(res.body.user.username).toBe(builder.username);

      // RFC agora é IN_BUILDING
      const detail = await request(app.getHttpServer()).get(`/rfcs/${rfc.slug}`).expect(200);
      expect(detail.body.status).toBe('IN_BUILDING');
    });

    it('REVIEWER e LEAD não disparam IN_BUILDING', async () => {
      const author = await registerUser(app);
      const reviewer = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(reviewer.accessToken))
        .send({ role: 'REVIEWER' })
        .expect(201);

      const detail = await request(app.getHttpServer()).get(`/rfcs/${rfc.slug}`).expect(200);
      expect(detail.body.status).toBe('IN_DISCUSSION');
    });

    it('rejeita inscrição em rascunho (409)', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(409);
    });

    it('rejeita inscrição em RFC arquivada (409)', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/archive`)
        .set(authHeader(author.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(409);
    });

    it('rejeita inscrição duplicada ativa (409)', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(201);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(409);
    });

    it('rejeita sem token (401)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer()).post(`/rfcs/${rfc.id}/enroll`).expect(401);
    });
  });

  describe('DELETE /rfcs/:id/enroll', () => {
    it('último BUILDER saindo volta status para IN_DISCUSSION', async () => {
      const author = await registerUser(app);
      const b1 = await registerUser(app);
      const b2 = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b1.accessToken))
        .expect(201);
      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b2.accessToken))
        .expect(201);

      // primeiro sai → ainda tem b2 → continua IN_BUILDING
      await request(app.getHttpServer())
        .delete(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b1.accessToken))
        .expect(200);

      let detail = await request(app.getHttpServer()).get(`/rfcs/${rfc.slug}`).expect(200);
      expect(detail.body.status).toBe('IN_BUILDING');

      // segundo sai → volta IN_DISCUSSION
      await request(app.getHttpServer())
        .delete(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b2.accessToken))
        .expect(200);

      detail = await request(app.getHttpServer()).get(`/rfcs/${rfc.slug}`).expect(200);
      expect(detail.body.status).toBe('IN_DISCUSSION');
    });

    it('reinscrição reseta leftAt', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(201);
      await request(app.getHttpServer())
        .delete(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .send({ message: 'voltei' })
        .expect(201);

      expect(res.body.leftAt).toBeNull();
      expect(res.body.message).toBe('voltei');

      const detail = await request(app.getHttpServer()).get(`/rfcs/${rfc.slug}`).expect(200);
      expect(detail.body.status).toBe('IN_BUILDING');
    });

    it('404 se nunca esteve inscrito', async () => {
      const author = await registerUser(app);
      const stranger = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .delete(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(stranger.accessToken))
        .expect(404);
    });
  });

  describe('GET /rfcs/:id/enrollments', () => {
    it('lista apenas inscrições ativas', async () => {
      const author = await registerUser(app);
      const b1 = await registerUser(app);
      const b2 = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b1.accessToken))
        .expect(201);
      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b2.accessToken))
        .expect(201);
      await request(app.getHttpServer())
        .delete(`/rfcs/${rfc.id}/enroll`)
        .set(authHeader(b1.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer()).get(`/rfcs/${rfc.id}/enrollments`).expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].user.username).toBe(b2.username);
    });
  });

  describe('GET /users/:username/enrollments', () => {
    it('lista RFCs públicas em que o usuário está inscrito', async () => {
      const author = await registerUser(app);
      const builder = await registerUser(app, { username: 'rafa' });

      const r1 = await createPublishedRfc(app, author, { title: 'RFC um' });
      const r2 = await createPublishedRfc(app, author, { title: 'RFC dois' });

      await request(app.getHttpServer())
        .post(`/rfcs/${r1.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(201);
      await request(app.getHttpServer())
        .post(`/rfcs/${r2.id}/enroll`)
        .set(authHeader(builder.accessToken))
        .expect(201);

      const res = await request(app.getHttpServer()).get('/users/rafa/enrollments').expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('404 se username inexistente', async () => {
      await request(app.getHttpServer()).get('/users/inexistente/enrollments').expect(404);
    });
  });
});
