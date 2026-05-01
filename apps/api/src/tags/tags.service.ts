import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RfcStatus, UserRole, Visibility } from '@prisma/client';
import { buildPaginatedResult, PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { slugify } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { SetRfcTagsDto } from './dto/set-rfc-tags.dto';

const RFC_LIST_BY_TAG_SELECT = {
  id: true,
  number: true,
  slug: true,
  title: true,
  summary: true,
  locale: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  author: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
  lab: { select: { id: true, slug: true, name: true, glyph: true } },
} satisfies Prisma.RfcSelect;

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.tag.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          createdAt: true,
          _count: { select: { rfcs: true } },
        },
        orderBy: [{ rfcs: { _count: 'desc' } }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tag.count(),
    ]);

    return buildPaginatedResult(
      data.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        createdAt: t.createdAt,
        usageCount: t._count.rfcs,
      })),
      total,
      query.page,
      query.limit,
    );
  }

  async findBySlug(slug: string, query: PaginationQueryDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        _count: { select: { rfcs: true } },
      },
    });
    if (!tag) throw new NotFoundException('tag not found');

    const where: Prisma.RfcWhereInput = {
      tags: { some: { tagId: tag.id } },
      visibility: Visibility.PUBLIC,
      status: { in: [RfcStatus.IN_DISCUSSION, RfcStatus.IN_BUILDING, RfcStatus.PUBLISHED] },
    };

    const [rfcs, total] = await Promise.all([
      this.prisma.rfc.findMany({
        where,
        select: RFC_LIST_BY_TAG_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rfc.count({ where }),
    ]);

    return {
      tag: {
        id: tag.id,
        slug: tag.slug,
        name: tag.name,
        createdAt: tag.createdAt,
        usageCount: tag._count.rfcs,
      },
      rfcs: buildPaginatedResult(rfcs, total, query.page, query.limit),
    };
  }

  async setForRfc(rfcId: string, user: AuthUser, dto: SetRfcTagsDto) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true, authorId: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    if (rfc.authorId !== user.id && user.role !== UserRole.MAINTAINER) {
      throw new ForbiddenException('apenas o autor pode editar tags da RFC');
    }

    // Normaliza nomes/slugs e remove duplicatas.
    const normalized = new Map<string, string>(); // slug → name original
    for (const raw of dto.tags) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const slug = slugify(trimmed);
      if (slug.length < 2) continue;
      if (!normalized.has(slug)) normalized.set(slug, trimmed);
    }

    const slugs = Array.from(normalized.keys());

    await this.prisma.$transaction(async (tx) => {
      // garante que cada tag existe (upsert por slug)
      for (const slug of slugs) {
        const name = normalized.get(slug) ?? slug;
        await tx.tag.upsert({
          where: { slug },
          create: { slug, name },
          update: {}, // não sobreescreve nome — tag canônica fica como criada
        });
      }

      // pega ids
      const tags = slugs.length
        ? await tx.tag.findMany({ where: { slug: { in: slugs } }, select: { id: true } })
        : [];
      const tagIds = new Set(tags.map((t) => t.id));

      // sync TagsOnRfcs: remove os que não estão no novo set, insere novos
      const current = await tx.tagsOnRfcs.findMany({
        where: { rfcId },
        select: { tagId: true },
      });
      const currentIds = new Set(current.map((c) => c.tagId));

      const toRemove = [...currentIds].filter((id) => !tagIds.has(id));
      const toAdd = [...tagIds].filter((id) => !currentIds.has(id));

      if (toRemove.length) {
        await tx.tagsOnRfcs.deleteMany({
          where: { rfcId, tagId: { in: toRemove } },
        });
      }
      if (toAdd.length) {
        await tx.tagsOnRfcs.createMany({
          data: toAdd.map((tagId) => ({ rfcId, tagId })),
          skipDuplicates: true,
        });
      }
    });

    // Retorna estado final
    const final = await this.prisma.tagsOnRfcs.findMany({
      where: { rfcId },
      select: { tag: { select: { id: true, slug: true, name: true } } },
      orderBy: { tag: { name: 'asc' } },
    });
    return final.map((t) => t.tag);
  }

  async listForRfc(rfcId: string) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');

    const list = await this.prisma.tagsOnRfcs.findMany({
      where: { rfcId },
      select: { tag: { select: { id: true, slug: true, name: true } } },
      orderBy: { tag: { name: 'asc' } },
    });
    return list.map((t) => t.tag);
  }
}
