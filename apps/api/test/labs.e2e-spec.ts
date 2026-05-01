import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, createDraftRfc, registerUser } from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Labs (e2e)', () => {
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

  describe('GET /labs', () => {
    it('retorna os 6 labs do seed em ordem', async () => {
      const res = await request(app.getHttpServer()).get('/labs').expect(200);

      expect(res.body).toHaveLength(6);
      const slugs = res.body.map((l: { slug: string }) => l.slug);
      expect(slugs).toEqual(['educacao', 'cidades', 'saude', 'cultura', 'tec-civica', 'econ-solidaria']);

      const educacao = res.body[0];
      expect(educacao).toMatchObject({
        slug: 'educacao',
        name: 'Lab. Educação',
        glyph: '◈',
        rfcsCount: 0,
        buildersCount: 0,
      });
    });

    it('rfcsCount conta apenas RFCs públicas em discussion/building/published', async () => {
      const user = await registerUser(app);
      const draft = await createDraftRfc(app, user, { labSlug: 'educacao' });

      // draft não conta
      let res = await request(app.getHttpServer()).get('/labs').expect(200);
      expect(res.body[0].rfcsCount).toBe(0);

      // publica → conta
      await request(app.getHttpServer())
        .post(`/rfcs/${draft.id}/publish`)
        .set(authHeader(user.accessToken))
        .expect(200);

      res = await request(app.getHttpServer()).get('/labs').expect(200);
      expect(res.body[0].rfcsCount).toBe(1);
    });
  });

  describe('GET /labs/:slug', () => {
    it('retorna detalhes do lab', async () => {
      const res = await request(app.getHttpServer()).get('/labs/cidades').expect(200);
      expect(res.body).toMatchObject({
        slug: 'cidades',
        name: 'Lab. Cidades',
        glyph: '◇',
      });
    });

    it('404 para slug inexistente', async () => {
      await request(app.getHttpServer()).get('/labs/nao-existe').expect(404);
    });
  });
});
