import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createDraftRfc,
  createPublishedRfc,
  registerUser,
} from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Comments (e2e)', () => {
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

  describe('POST /rfcs/:id/comments', () => {
    it('cria comentário em RFC pública', async () => {
      const author = await registerUser(app);
      const commenter = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(commenter.accessToken))
        .send({ body: 'Excelente proposta!' })
        .expect(201);

      expect(res.body).toMatchObject({
        body: 'Excelente proposta!',
        isEdited: false,
        isDeleted: false,
      });
      expect(res.body.author.username).toBe(commenter.username);
    });

    it('rejeita body vazio (400)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: '' })
        .expect(400);
    });

    it('rejeita comentário em rascunho de outro autor (404)', async () => {
      const author = await registerUser(app);
      const stranger = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/comments`)
        .set(authHeader(stranger.accessToken))
        .send({ body: 'oi' })
        .expect(404);
    });

    it('autor do rascunho pode comentar nele', async () => {
      const author = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'rascunho' })
        .expect(201);
    });

    it('rejeita comentário em RFC arquivada (403)', async () => {
      const author = await registerUser(app);
      const commenter = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/archive`)
        .set(authHeader(author.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(commenter.accessToken))
        .send({ body: 'tarde demais' })
        .expect(403);
    });

    it('rejeita sem token (401)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .send({ body: 'oi' })
        .expect(401);
    });
  });

  describe('GET /rfcs/:id/comments', () => {
    it('lista comentários cronologicamente paginados', async () => {
      const author = await registerUser(app);
      const c1 = await registerUser(app);
      const c2 = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(c1.accessToken))
        .send({ body: 'primeiro' });
      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(c2.accessToken))
        .send({ body: 'segundo' });

      const res = await request(app.getHttpServer()).get(`/rfcs/${rfc.id}/comments`).expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].body).toBe('primeiro');
      expect(res.body.data[1].body).toBe('segundo');
    });

    it('rascunho não revela comentários ao público (404)', async () => {
      const author = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer()).get(`/rfcs/${draft.id}/comments`).expect(404);
    });
  });

  describe('PATCH /comments/:id', () => {
    it('autor edita e marca isEdited', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'rascunho do comentário' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/comments/${c.body.id}`)
        .set(authHeader(author.accessToken))
        .send({ body: 'versão final' })
        .expect(200);

      expect(res.body.body).toBe('versão final');
      expect(res.body.isEdited).toBe(true);
    });

    it('outro usuário não pode editar (403)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'meu comentário' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/comments/${c.body.id}`)
        .set(authHeader(intruder.accessToken))
        .send({ body: 'invasão' })
        .expect(403);
    });

    it('mesmo body não marca isEdited', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'igual' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/comments/${c.body.id}`)
        .set(authHeader(author.accessToken))
        .send({ body: 'igual' })
        .expect(200);

      expect(res.body.isEdited).toBe(false);
    });
  });

  describe('DELETE /comments/:id', () => {
    it('autor faz soft delete e body vira [removido]', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'segredo do estado' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/comments/${c.body.id}`)
        .set(authHeader(author.accessToken))
        .expect(200);

      const list = await request(app.getHttpServer()).get(`/rfcs/${rfc.id}/comments`).expect(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].body).toBe('[removido]');
      expect(list.body.data[0].isDeleted).toBe(true);
    });

    it('comentário deletado não pode ser editado (403)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'temp' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/comments/${c.body.id}`)
        .set(authHeader(author.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/comments/${c.body.id}`)
        .set(authHeader(author.accessToken))
        .send({ body: 'tentativa' })
        .expect(403);
    });

    it('outro usuário não pode deletar (403)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const c = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/comments`)
        .set(authHeader(author.accessToken))
        .send({ body: 'meu' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/comments/${c.body.id}`)
        .set(authHeader(intruder.accessToken))
        .expect(403);
    });
  });

  describe('GET /users/:username/rfcs', () => {
    it('lista RFCs públicas escritas pelo usuário', async () => {
      const author = await registerUser(app, { username: 'luisa' });

      await createPublishedRfc(app, author, { title: 'Primeira' });
      await createPublishedRfc(app, author, { title: 'Segunda' });
      // rascunho não conta
      await createDraftRfc(app, author, { title: 'Terceira (draft)' });

      const res = await request(app.getHttpServer()).get('/users/luisa/rfcs').expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('404 para username inexistente', async () => {
      await request(app.getHttpServer()).get('/users/ninguem/rfcs').expect(404);
    });
  });
});
