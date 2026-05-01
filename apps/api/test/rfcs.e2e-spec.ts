import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createDraftRfc,
  getLabIdBySlug,
  registerUser,
} from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('RFCs (e2e)', () => {
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

  describe('POST /rfcs', () => {
    it('cria RFC como DRAFT com versão 1', async () => {
      const user = await registerUser(app);
      const labId = await getLabIdBySlug(app, 'educacao');

      const res = await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user.accessToken))
        .send({
          title: 'Biblioteca Cooperativa de Bairro',
          summary: 'Catálogo simples para vizinhos emprestarem livros entre si.',
          body: 'Corpo da RFC em markdown com pelo menos cinquenta caracteres para passar pela validação.',
          labId,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'Biblioteca Cooperativa de Bairro',
        slug: 'biblioteca-cooperativa-de-bairro',
        status: 'DRAFT',
        number: null,
        locale: 'pt-BR',
      });
      expect(res.body.author.username).toBe(user.username);
      expect(res.body.lab.slug).toBe('educacao');
      expect(res.body._count.versions).toBe(1);
    });

    it('autor pode informar slug customizado', async () => {
      const user = await registerUser(app);
      const labId = await getLabIdBySlug(app, 'educacao');

      const res = await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user.accessToken))
        .send({
          title: 'Biblioteca Cooperativa',
          summary: 'Resumo curto.',
          body: 'Corpo da RFC com pelo menos cinquenta caracteres para passar pela validação.',
          labId,
          slug: 'biblioteca-bairro',
        })
        .expect(201);

      expect(res.body.slug).toBe('biblioteca-bairro');
    });

    it('gera slug com sufixo numérico em caso de colisão', async () => {
      const user1 = await registerUser(app);
      const user2 = await registerUser(app);
      const labId = await getLabIdBySlug(app, 'educacao');

      const r1 = await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user1.accessToken))
        .send({
          title: 'Biblioteca Cooperativa',
          summary: 'Resumo curto a.',
          body: 'Corpo a com mais de cinquenta caracteres para passar pela validação.',
          labId,
        })
        .expect(201);
      expect(r1.body.slug).toBe('biblioteca-cooperativa');

      const r2 = await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user2.accessToken))
        .send({
          title: 'Biblioteca Cooperativa',
          summary: 'Resumo curto b.',
          body: 'Corpo b com mais de cinquenta caracteres para passar pela validação.',
          labId,
        })
        .expect(201);
      expect(r2.body.slug).toBe('biblioteca-cooperativa-2');
    });

    it('rejeita sem token (401)', async () => {
      const labId = await getLabIdBySlug(app, 'educacao');
      await request(app.getHttpServer())
        .post('/rfcs')
        .send({
          title: 'X',
          summary: 'X',
          body: 'X'.repeat(60),
          labId,
        })
        .expect(401);
    });

    it('rejeita lab inexistente (404)', async () => {
      const user = await registerUser(app);
      await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user.accessToken))
        .send({
          title: 'Biblioteca Cooperativa',
          summary: 'Resumo curto.',
          body: 'Corpo com mais de cinquenta caracteres para passar pela validação.',
          labId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('rejeita body curto demais (400)', async () => {
      const user = await registerUser(app);
      const labId = await getLabIdBySlug(app, 'educacao');

      await request(app.getHttpServer())
        .post('/rfcs')
        .set(authHeader(user.accessToken))
        .send({
          title: 'Biblioteca Cooperativa',
          summary: 'Resumo curto.',
          body: 'pequeno',
          labId,
        })
        .expect(400);
    });
  });

  describe('GET /rfcs/:slug', () => {
    it('rascunho não é visível ao público (404)', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      await request(app.getHttpServer()).get(`/rfcs/${draft.slug}`).expect(404);
    });

    it('publicada é visível e tem número e status IN_DISCUSSION', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      const res = await request(app.getHttpServer()).get(`/rfcs/${draft.slug}`).expect(200);

      expect(res.body.status).toBe('IN_DISCUSSION');
      expect(res.body.number).toBeGreaterThan(0);
      expect(res.body.publishedAt).toBeTruthy();
    });

    it('404 se slug não existe', async () => {
      await request(app.getHttpServer()).get('/rfcs/nao-existe-mesmo').expect(404);
    });
  });

  describe('GET /rfcs', () => {
    it('lista vazia inicialmente', async () => {
      const res = await request(app.getHttpServer()).get('/rfcs').expect(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('rascunhos não aparecem na lista', async () => {
      const user = await registerUser(app);
      await createDraftRfc(app, user);

      const res = await request(app.getHttpServer()).get('/rfcs').expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('filtra por lab e por locale', async () => {
      const user = await registerUser(app);

      const r1 = await createDraftRfc(app, user, { labSlug: 'educacao', locale: 'pt-BR' });
      const r2 = await createDraftRfc(app, user, { labSlug: 'cidades', locale: 'en' });

      await request(app.getHttpServer())
        .post(`/rfcs/${r1.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);
      await request(app.getHttpServer())
        .post(`/rfcs/${r2.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      const all = await request(app.getHttpServer()).get('/rfcs').expect(200);
      expect(all.body.data).toHaveLength(2);

      const ed = await request(app.getHttpServer()).get('/rfcs?lab=educacao').expect(200);
      expect(ed.body.data).toHaveLength(1);
      expect(ed.body.data[0].lab.slug).toBe('educacao');

      const en = await request(app.getHttpServer()).get('/rfcs?locale=en').expect(200);
      expect(en.body.data).toHaveLength(1);
      expect(en.body.data[0].locale).toBe('en');
    });
  });

  describe('GET /rfcs/featured', () => {
    it('retorna até 3 RFCs em IN_DISCUSSION/IN_BUILDING', async () => {
      const user = await registerUser(app);

      for (let i = 0; i < 4; i++) {
        const draft = await createDraftRfc(app, user, { title: `RFC número ${i + 1}` });
        await request(app.getHttpServer())
          .post(`/rfcs/${draft.id}/publish`)
          .set(authHeader(user.accessToken))
          .expect(200);
      }

      const res = await request(app.getHttpServer()).get('/rfcs/featured').expect(200);
      expect(res.body).toHaveLength(3);
    });
  });

  describe('PATCH /rfcs/:id', () => {
    it('autor edita título e body cria nova versão', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      const res = await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(user.accessToken))
        .send({
          title: 'Título atualizado',
          body: 'Corpo COMPLETAMENTE novo com mais de cinquenta caracteres para passar pela validação.',
        })
        .expect(200);

      expect(res.body.title).toBe('Título atualizado');
      expect(res.body._count.versions).toBe(2);
    });

    it('mudança apenas em title NÃO cria versão nova', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      const res = await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(user.accessToken))
        .send({ title: 'Só o título mudou' })
        .expect(200);

      expect(res.body._count.versions).toBe(1);
    });

    it('outro usuário não pode editar (403)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(intruder.accessToken))
        .send({ title: 'tentativa de invasão' })
        .expect(403);
    });

    it('slug não pode ser alterado após publicação (409)', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(user.accessToken))
        .send({ slug: 'novo-slug-tentativa' })
        .expect(409);
    });
  });

  describe('POST /rfcs/:id/publish', () => {
    it('atribui números crescentes', async () => {
      const user = await registerUser(app);
      const r1 = await createDraftRfc(app, user, { title: 'Primeira RFC' });
      const r2 = await createDraftRfc(app, user, { title: 'Segunda RFC' });

      const p1 = await request(app.getHttpServer())
        .post(`/rfcs/${r1.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);
      const p2 = await request(app.getHttpServer())
        .post(`/rfcs/${r2.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(p1.body.number).toBeGreaterThan(0);
      expect(p2.body.number).toBe(p1.body.number + 1);
    });

    it('republicar já publicada falha (409)', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(409);
    });

    it('outro usuário não pode publicar (403)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(intruder.accessToken))
        .expect(403);
    });
  });

  describe('POST /rfcs/:id/archive', () => {
    it('autor arquiva e o status muda', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/archive`)
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(res.body.status).toBe('ARCHIVED');
      expect(res.body.archivedAt).toBeTruthy();
    });
  });

  describe('GET /rfcs/:id/versions', () => {
    it('retorna histórico ordenado mais recente primeiro', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user);

      // edita o body 2 vezes → versões 2 e 3
      await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(user.accessToken))
        .send({
          body: 'Segunda versão do corpo com mais de cinquenta caracteres para passar pela validação.',
        })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/rfcs/${draft.id}`)
        .set(authHeader(user.accessToken))
        .send({
          body: 'Terceira versão do corpo com mais de cinquenta caracteres para passar pela validação.',
        })
        .expect(200);

      // ainda é DRAFT — autor consegue ver com seu token
      const res = await request(app.getHttpServer())
        .get(`/rfcs/${draft.id}/versions`)
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body.map((v: { version: number }) => v.version)).toEqual([3, 2, 1]);
    });

    it('rascunho não revela versões a quem não é autor (404)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const draft = await createDraftRfc(app, author);

      // sem token
      await request(app.getHttpServer()).get(`/rfcs/${draft.id}/versions`).expect(404);

      // com token de outro user
      await request(app.getHttpServer())
        .get(`/rfcs/${draft.id}/versions`)
        .set(authHeader(intruder.accessToken))
        .expect(404);
    });
  });
});
