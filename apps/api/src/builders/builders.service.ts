import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { buildPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ListBuildersQueryDto } from './dto/list-builders.query.dto';
import { UpsertBuilderProfileDto } from './dto/upsert-builder-profile.dto';

const BUILDER_SELECT = {
  user: {
    select: {
      id: true,
      username: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  headline: true,
  topics: true,
  isOpenToWork: true,
  updatedAt: true,
} satisfies Prisma.BuilderProfileSelect;

export type BuilderListItem = Prisma.BuilderProfileGetPayload<{ select: typeof BUILDER_SELECT }>;

@Injectable()
export class BuildersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListBuildersQueryDto): Promise<PaginatedResult<BuilderListItem>> {
    const where: Prisma.BuilderProfileWhereInput = {
      user: { isActive: true },
      ...(query.topic ? { topics: { has: query.topic } } : {}),
      ...(query.isOpenToWork === undefined ? {} : { isOpenToWork: query.isOpenToWork }),
    };

    const [data, total] = await Promise.all([
      this.prisma.builderProfile.findMany({
        where,
        select: BUILDER_SELECT,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.builderProfile.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findByUsername(username: string): Promise<BuilderListItem> {
    const profile = await this.prisma.builderProfile.findFirst({
      where: { user: { username, isActive: true } },
      select: BUILDER_SELECT,
    });

    if (!profile) {
      throw new NotFoundException('builder profile not found');
    }
    return profile;
  }

  async upsertSelf(userId: string, dto: UpsertBuilderProfileDto): Promise<BuilderListItem> {
    return this.prisma.builderProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline: dto.headline,
        topics: dto.topics ?? [],
        isOpenToWork: dto.isOpenToWork ?? true,
      },
      update: {
        headline: dto.headline,
        topics: dto.topics,
        isOpenToWork: dto.isOpenToWork,
      },
      select: BUILDER_SELECT,
    });
  }
}
