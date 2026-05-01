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
