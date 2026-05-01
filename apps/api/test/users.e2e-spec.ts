import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, registerUser } from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Users (e2e)', () => {
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

  describe('GET /users/me', () => {
    it('retorna perfil completo com email e role', async () => {
      const user = await registerUser(app, { username: 'luisa' });

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(res.body).toMatchObject({
        username: 'luisa',
        email: user.email,
        role: 'USER',
        emailVerified: false,
        preferredLocale: 'pt-BR',
      });
    });

    it('rejeita sem token (401)', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('atualiza fullName, bio e preferredLocale', async () => {
      const user = await registerUser(app);

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(user.accessToken))
        .send({
          fullName: 'Luísa Pereira',
          bio: 'Professora, ama livros.',
          preferredLocale: 'en',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        fullName: 'Luísa Pereira',
        bio: 'Professora, ama livros.',
        preferredLocale: 'en',
      });
    });

    it('rejeita preferredLocale inválido (400)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(user.accessToken))
        .send({ preferredLocale: 'es' })
        .expect(400);
    });

    it('rejeita avatarUrl que não é URL (400)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(user.accessToken))
        .send({ avatarUrl: 'nao-e-url' })
        .expect(400);
    });

    it('rejeita propriedades não-whitelist (400)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(user.accessToken))
        .send({ role: 'MAINTAINER' })
        .expect(400);
    });
  });

  describe('GET /users/:username', () => {
    it('retorna perfil público sem email/role', async () => {
      const user = await registerUser(app, { username: 'luisa' });

      await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(user.accessToken))
        .send({ fullName: 'Luísa Pereira', bio: 'Professora.' })
        .expect(200);

      const res = await request(app.getHttpServer()).get('/users/luisa').expect(200);

      expect(res.body).toMatchObject({
        username: 'luisa',
        fullName: 'Luísa Pereira',
        bio: 'Professora.',
      });
      expect(res.body.email).toBeUndefined();
      expect(res.body.role).toBeUndefined();
      expect(res.body.emailVerified).toBeUndefined();
    });

    it('retorna 404 para username inexistente', async () => {
      await request(app.getHttpServer()).get('/users/inexistente').expect(404);
    });
  });
});
