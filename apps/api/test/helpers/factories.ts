import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type RegisteredUser = {
  username: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  id: string;
};

export const registerUser = async (
  app: INestApplication,
  overrides: Partial<{ username: string; email: string; password: string }> = {},
): Promise<RegisteredUser> => {
  const username = overrides.username ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = overrides.email ?? `${username}@example.com`;
  const password = overrides.password ?? 'senha-bem-segura-123';

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ username, email, password })
    .expect(201);

  return {
    username,
    email,
    password,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    id: res.body.user.id,
  };
};

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const getLabIdBySlug = async (app: INestApplication, slug: string): Promise<string> => {
  const res = await request(app.getHttpServer()).get(`/labs/${slug}`).expect(200);
  return res.body.id;
};

export type CreatedRfc = {
  id: string;
  slug: string;
  number: number | null;
  status: string;
};

export const publishRfc = async (
  app: INestApplication,
  user: RegisteredUser,
  rfcId: string,
): Promise<CreatedRfc> => {
  const res = await request(app.getHttpServer())
    .post(`/rfcs/${rfcId}/publish`)
    .set(authHeader(user.accessToken))
    .expect(200);
  return {
    id: res.body.id,
    slug: res.body.slug,
    number: res.body.number,
    status: res.body.status,
  };
};

export const createPublishedRfc = async (
  app: INestApplication,
  user: RegisteredUser,
  overrides: Partial<{
    title: string;
    summary: string;
    body: string;
    labSlug: string;
    locale: 'pt-BR' | 'en';
  }> = {},
): Promise<CreatedRfc> => {
  const draft = await createDraftRfc(app, user, overrides);
  return publishRfc(app, user, draft.id);
};

export const createDraftRfc = async (
  app: INestApplication,
  user: RegisteredUser,
  overrides: Partial<{
    title: string;
    summary: string;
    body: string;
    labSlug: string;
    locale: 'pt-BR' | 'en';
  }> = {},
): Promise<CreatedRfc> => {
  const labId = await getLabIdBySlug(app, overrides.labSlug ?? 'educacao');

  const res = await request(app.getHttpServer())
    .post('/rfcs')
    .set(authHeader(user.accessToken))
    .send({
      title: overrides.title ?? `RFC de teste ${Date.now()}`,
      summary: overrides.summary ?? 'Resumo de teste para a RFC.',
      body:
        overrides.body ??
        'Corpo da RFC em markdown com pelo menos cinquenta caracteres para passar pela validação.',
      labId,
      locale: overrides.locale,
    })
    .expect(201);

  return {
    id: res.body.id,
    slug: res.body.slug,
    number: res.body.number,
    status: res.body.status,
  };
};
