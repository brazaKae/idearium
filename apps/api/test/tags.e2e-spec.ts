import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createPublishedRfc,
  registerUser,
} from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Tags (e2e)', () => {
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

  describe('POST /rfcs/:id/tags', () => {
    it('cria tags via slugify e associa à RFC', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(author.accessToken))
        .send({ tags: ['civic-tech', 'Geolocalização', 'dados abertos'] })
        .expect(201);

      const slugs = res.body.map((t: { slug: string }) => t.slug).sort();
      expect(slugs).toEqual(['civic-tech', 'dados-abertos', 'geolocalizacao']);
    });

    it('substitui o set inteiro (sync)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(author.accessToken))
        .send({ tags: ['alpha', 'beta'] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(author.accessToken))
        .send({ tags: ['beta', 'gamma'] })
        .expect(201);

      const slugs = res.body.map((t: { slug: string }) => t.slug).sort();
      expect(slugs).toEqual(['beta', 'gamma']);
    });

    it('reaproveita tag existente (mesmo slug, outro RFC)', async () => {
      const a1 = await registerUser(app);
      const a2 = await registerUser(app);
      const r1 = await createPublishedRfc(app, a1, { title: 'RFC um' });
      const r2 = await createPublishedRfc(app, a2, { title: 'RFC dois' });

      await request(app.getHttpServer())
        .post(`/rfcs/${r1.id}/tags`)
        .set(authHeader(a1.accessToken))
        .send({ tags: ['saúde'] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/rfcs/${r2.id}/tags`)
        .set(authHeader(a2.accessToken))
        .send({ tags: ['Saúde'] })
        .expect(201);

      const tags = await request(app.getHttpServer()).get('/tags').expect(200);
      const saude = tags.body.data.find((t: { slug: string }) => t.slug === 'saude');
      expect(saude.usageCount).toBe(2);
    });

    it('outro usuário não pode editar tags (403)', async () => {
      const author = await registerUser(app);
      const intruder = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(intruder.accessToken))
        .send({ tags: ['xx'] })
        .expect(403);
    });

    it('rejeita > 10 tags (400)', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(author.accessToken))
        .send({ tags: Array(11).fill('tag') })
        .expect(400);
    });
  });

  describe('GET /tags', () => {
    it('ordena por uso decrescente', async () => {
      const a1 = await registerUser(app);
      const r1 = await createPublishedRfc(app, a1, { title: 'Primeira RFC' });
      const r2 = await createPublishedRfc(app, a1, { title: 'Segunda RFC' });

      await request(app.getHttpServer())
        .post(`/rfcs/${r1.id}/tags`)
        .set(authHeader(a1.accessToken))
        .send({ tags: ['comum', 'só-uma'] });
      await request(app.getHttpServer())
        .post(`/rfcs/${r2.id}/tags`)
        .set(authHeader(a1.accessToken))
        .send({ tags: ['comum'] });

      const res = await request(app.getHttpServer()).get('/tags').expect(200);
      expect(res.body.data[0].slug).toBe('comum');
      expect(res.body.data[0].usageCount).toBe(2);
    });
  });

  describe('GET /tags/:slug', () => {
    it('retorna tag + RFCs associadas', async () => {
      const author = await registerUser(app);
      const rfc = await createPublishedRfc(app, author);

      await request(app.getHttpServer())
        .post(`/rfcs/${rfc.id}/tags`)
        .set(authHeader(author.accessToken))
        .send({ tags: ['civic-tech'] });

      const res = await request(app.getHttpServer()).get('/tags/civic-tech').expect(200);
      expect(res.body.tag.slug).toBe('civic-tech');
      expect(res.body.rfcs.data).toHaveLength(1);
      expect(res.body.rfcs.data[0].id).toBe(rfc.id);
    });

    it('404 para slug inexistente', async () => {
      await request(app.getHttpServer()).get('/tags/inexistente').expect(404);
    });
  });
});
