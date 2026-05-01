import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  bio: true,
  avatarUrl: true,
  preferredLocale: true,
  createdAt: true,
  builderProfile: {
    select: {
      headline: true,
      topics: true,
      isOpenToWork: true,
    },
  },
} as const;

const SELF_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  email: true,
  emailVerified: true,
  role: true,
} as const;

export type PublicUser = Awaited<ReturnType<UsersService['findByUsername']>>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username, isActive: true },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async findSelf(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SELF_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async updateSelf(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        preferredLocale: dto.preferredLocale,
      },
      select: SELF_USER_SELECT,
    });
  }
}
