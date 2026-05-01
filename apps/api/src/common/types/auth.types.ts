import type { UserRole } from '@prisma/client';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
};

export type JwtPayload = {
  sub: string;
  username: string;
  role: UserRole;
};
