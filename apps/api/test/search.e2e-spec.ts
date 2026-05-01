import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createDraftRfc, createPublishedRfc, registerUser } from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Search (e2e)', () => {
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

  describe('GET /search', () => {
    it('encontra RFC por palavra do título (pt-BR, com stemming)', async () => {
      const author = await registerUser(app);
      await createPublishedRfc(app, author, {
        title: 'Rastreamento de Enchentes Urbanas',
        summary: 'Canal colaborativo de relatos sobre alagamentos.',
        body: 'Corpo discutindo rede de relatos anônimos sobre enchentes em áreas urbanas com geolocalização.',
        labSlug: 'cidades',
      });

      // singular ↔ plural via stemmer português
      let res = await request(app.getHttpServer())
        .get('/search?q=enchente')
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toContain('Enchentes');
      expect(res.body.data[0].rank).toBeGreaterThan(0);

      res = await request(app.getHttpServer()).get('/search?q=enchentes').expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('busca em pt-BR não retorna conteúdo em inglês', async () => {
      const author = await registerUser(app);
      await createPublishedRfc(app, author, {
        title: 'Anonymous Flood Reporting',
        summary: 'Crowdsourced reports on urban flooding events.',
        body: 'Body about a network of geolocated anonymous flooding reports as open data.',
        labSlug: 'cidades',
        locale: 'en',
      });

      const res = await request(app.getHttpServer())
        .get('/search?q=enchente&locale=pt-BR')
        .expect(200);
      expect(res.body.data).toHaveLength(0);

      const enRes = await request(app.getHttpServer())
        .get('/search?q=flooding&locale=en')
        .expect(200);
      expect(enRes.body.data).toHaveLength(1);
    });

    it('locale=en só retorna RFCs em inglês', async () => {
      const author = await registerUser(app);
      await createPublishedRfc(app, author, {
        title: 'Floods in our streets',
        summary: 'About urban flooding.',
        body: 'Body discussing a network of geolocated anonymous flooding reports as open data.',
        locale: 'en',
        labSlug: 'cidades',
      });

      const res = await request(app.getHttpServer())
        .get('/search?q=flooding&locale=en')
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('filtra por lab', async () => {
      const author = await registerUser(app);
      await createPublishedRfc(app, author, {
        title: 'Educação cidadã',
        summary: 'Cidadania nas escolas.',
        body: 'Corpo discutindo cidadania e participação política nas escolas públicas brasileiras.',
        labSlug: 'educacao',
      });
      await createPublishedRfc(app, author, {
        title: 'Cidades inteligentes',
        summary: 'Mobilidade.',
        body: 'Corpo discutindo cidadania urbana através de dados abertos e mobilidade para o cidadão.',
        labSlug: 'cidades',
      });

      // sem filtro: 2 hits
      const all = await request(app.getHttpServer()).get('/search?q=cidadania').expect(200);
      expect(all.body.data).toHaveLength(2);

      // filtrando por lab: 1 hit cada
      const ed = await request(app.getHttpServer())
        .get('/search?q=cidadania&lab=educacao')
        .expect(200);
      expect(ed.body.data).toHaveLength(1);
      expect(ed.body.data[0].title).toContain('Educação');

      const cd = await request(app.getHttpServer())
        .get('/search?q=cidadania&lab=cidades')
        .expect(200);
      expect(cd.body.data).toHaveLength(1);
      expect(cd.body.data[0].title).toContain('Cidades');
    });

    it('rascunho e arquivada não aparecem na busca', async () => {
      const author = await registerUser(app);
      await createDraftRfc(app, author, {
        title: 'Rascunho de teste',
        body: 'Corpo discutindo coisa única bem distintiva chamada zorblefax frob nunca antes vista.',
      });

      const res = await request(app.getHttpServer()).get('/search?q=zorblefax').expect(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('rejeita query muito curta (400)', async () => {
      await request(app.getHttpServer()).get('/search?q=a').expect(400);
    });

    it('paginação funciona', async () => {
      const author = await registerUser(app);
      for (let i = 0; i < 3; i++) {
        await createPublishedRfc(app, author, {
          title: `RFC sobre transporte urbano número ${i}`,
          body: `Corpo discutindo transporte urbano e mobilidade no contexto número ${i} de teste.`,
          labSlug: 'cidades',
        });
      }

      const res = await request(app.getHttpServer())
        .get('/search?q=transporte&page=1&limit=2')
        .expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });
  });
});
