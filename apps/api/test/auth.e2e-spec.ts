import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, registerUser } from './helpers/factories';
import { cleanDatabase, createTestApp } from './helpers/test-app';

describe('Auth (e2e)', () => {
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

  describe('POST /auth/register', () => {
    it('cria usuário e retorna tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'luisa',
          email: 'luisa@example.com',
          password: 'senha-bem-segura',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        username: 'luisa',
        email: 'luisa@example.com',
        role: 'USER',
      });
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('normaliza username e email para lowercase + trim', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: '  LUISA  ',
          email: '  Luisa@Example.COM  ',
          password: 'senha-bem-segura',
        })
        .expect(201);

      expect(res.body.user.username).toBe('luisa');
      expect(res.body.user.email).toBe('luisa@example.com');
    });

    it('rejeita username duplicado (409)', async () => {
      await registerUser(app, { username: 'luisa', email: 'l1@example.com' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'luisa', email: 'l2@example.com', password: 'senha-bem-segura' })
        .expect(409);
    });

    it('rejeita email duplicado (409)', async () => {
      await registerUser(app, { username: 'luisa1', email: 'mesma@example.com' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'luisa2', email: 'mesma@example.com', password: 'senha-bem-segura' })
        .expect(409);
    });

    it('rejeita senha curta (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'foo', email: 'foo@example.com', password: '123' })
        .expect(400);

      expect(Array.isArray(res.body.message)).toBe(true);
      expect(res.body.message.join(' ')).toContain('10');
    });

    it('rejeita email inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'foo', email: 'nao-eh-email', password: 'senha-bem-segura' })
        .expect(400);
    });

    it('rejeita username com caracteres inválidos (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'Foo Bar', email: 'foo@example.com', password: 'senha-bem-segura' })
        .expect(400);
    });

    it('responde mensagens em inglês com Accept-Language: en', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Accept-Language', 'en')
        .send({ username: 'foo', email: 'foo@example.com', password: '123' })
        .expect(400);

      expect(res.body.message.join(' ')).toMatch(/at least 10/i);
    });
  });

  describe('POST /auth/login', () => {
    it('retorna tokens com credenciais válidas', async () => {
      const user = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.username).toBe(user.username);
    });

    it('rejeita senha errada (401)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'errada-mas-longa' })
        .expect(401);
    });

    it('rejeita email inexistente (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nao-existe@example.com', password: 'senha-bem-segura' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('retorna o usuário autenticado', async () => {
      const user = await registerUser(app);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set(authHeader(user.accessToken))
        .expect(200);

      expect(res.body).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'USER',
      });
    });

    it('rejeita sem token (401)', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('rejeita token inválido (401)', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not-a-real-jwt')
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotaciona tokens com refresh válido', async () => {
      const user = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(user.refreshToken);
    });

    it('rejeita refresh já rotacionado (401)', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
    });

    it('rejeita refresh inválido (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'nao-e-um-token-real' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revoga refresh e bloqueia uso futuro', async () => {
      const user = await registerUser(app);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: user.refreshToken })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
    });
  });
});
