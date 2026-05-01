import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RfcStatus, UserRole } from '@prisma/client';
import { buildPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { isValidSlug, slugify } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfcDto } from './dto/create-rfc.dto';
import { ListRfcsQueryDto } from './dto/list-rfcs.query.dto';
import { UpdateRfcDto } from './dto/update-rfc.dto';

const PUBLIC_RFC_STATUSES: RfcStatus[] = [
  RfcStatus.IN_DISCUSSION,
  RfcStatus.IN_BUILDING,
  RfcStatus.PUBLISHED,
];

const RFC_LIST_SELECT = {
  id: true,
  number: true,
  slug: true,
  title: true,
  summary: true,
  locale: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
  lab: { select: { id: true, slug: true, name: true, glyph: true } },
  _count: { select: { versions: true } },
} satisfies Prisma.RfcSelect;

const RFC_DETAIL_SELECT = {
  ...RFC_LIST_SELECT,
  body: true,
  visibility: true,
  archivedAt: true,
  translationOfId: true,
  translationOf: { select: { id: true, number: true, slug: true, locale: true, title: true } },
} satisfies Prisma.RfcSelect;

export type RfcListItem = Prisma.RfcGetPayload<{ select: typeof RFC_LIST_SELECT }>;
export type RfcDetail = Prisma.RfcGetPayload<{ select: typeof RFC_DETAIL_SELECT }>;

@Injectable()
export class RfcsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- create ----------

  async create(user: AuthUser, dto: CreateRfcDto): Promise<RfcDetail> {
    const lab = await this.prisma.lab.findFirst({
      where: { id: dto.labId, isActive: true },
      select: { id: true },
    });
    if (!lab) throw new NotFoundException('lab not found');

    if (dto.translationOfId) {
      const original = await this.prisma.rfc.findUnique({
        where: { id: dto.translationOfId },
        select: { id: true },
      });
      if (!original) throw new NotFoundException('original RFC for translation not found');
    }

    const userPref = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { preferredLocale: true },
    });
    const locale = dto.locale ?? userPref?.preferredLocale ?? 'pt-BR';
    if (locale !== 'pt-BR' && locale !== 'en') {
      throw new BadRequestException('locale must be "pt-BR" or "en"');
    }

    const slug = await this.resolveSlug(dto.slug ?? dto.title);

    const created = await this.prisma.rfc.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        labId: dto.labId,
        authorId: user.id,
        slug,
        locale,
        status: RfcStatus.DRAFT,
        translationOfId: dto.translationOfId ?? null,
        versions: {
          create: {
            version: 1,
            body: dto.body,
            authorId: user.id,
          },
        },
      },
      select: RFC_DETAIL_SELECT,
    });

    return created;
  }

  // ---------- list ----------

  async list(query: ListRfcsQueryDto, viewer?: AuthUser): Promise<PaginatedResult<RfcListItem>> {
    const where: Prisma.RfcWhereInput = {
      visibility: 'PUBLIC',
      ...(query.status ? { status: query.status } : { status: { in: PUBLIC_RFC_STATUSES } }),
      ...(query.lab ? { lab: { slug: query.lab, isActive: true } } : {}),
      ...(query.locale ? { locale: query.locale } : {}),
    };

    // Drafts/private nunca aparecem na lista pública.
    // Mesmo o autor não vê seus rascunhos aqui — usa /rfcs/me/drafts (Etapa 2.5+) se quiser.
    void viewer;

    const orderBy: Prisma.RfcOrderByWithRelationInput =
      query.sort === 'popular' ? { versions: { _count: 'desc' } } : { publishedAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.rfc.findMany({
        where,
        select: RFC_LIST_SELECT,
        orderBy: [orderBy, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rfc.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async featured(): Promise<RfcListItem[]> {
    return this.prisma.rfc.findMany({
      where: {
        visibility: 'PUBLIC',
        status: { in: [RfcStatus.IN_DISCUSSION, RfcStatus.IN_BUILDING] },
      },
      select: RFC_LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
  }

  async listAuthoredBy(
    username: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<RfcListItem>> {
    const author = await this.prisma.user.findFirst({
      where: { username, isActive: true },
      select: { id: true },
    });
    if (!author) throw new NotFoundException('user not found');

    const where: Prisma.RfcWhereInput = {
      authorId: author.id,
      visibility: 'PUBLIC',
      status: { in: PUBLIC_RFC_STATUSES },
    };

    const [data, total] = await Promise.all([
      this.prisma.rfc.findMany({
        where,
        select: RFC_LIST_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rfc.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  // ---------- read ----------

  async findBySlug(slug: string, viewer?: AuthUser): Promise<RfcDetail> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { slug },
      select: { ...RFC_DETAIL_SELECT, authorId: true },
    });

    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertViewerCanSee(rfc, viewer);

    // strip authorId (interno)
    const { authorId: _authorId, ...result } = rfc;
    return result;
  }

  async findById(id: string, viewer?: AuthUser): Promise<RfcDetail> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id },
      select: { ...RFC_DETAIL_SELECT, authorId: true },
    });

    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertViewerCanSee(rfc, viewer);

    const { authorId: _authorId, ...result } = rfc;
    return result;
  }

  async listVersions(id: string, viewer?: AuthUser) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id },
      select: { id: true, status: true, visibility: true, authorId: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertViewerCanSee(rfc, viewer);

    return this.prisma.rfcVersion.findMany({
      where: { rfcId: id },
      select: {
        id: true,
        version: true,
        body: true,
        authorId: true,
        createdAt: true,
      },
      orderBy: { version: 'desc' },
    });
  }

  // ---------- update ----------

  async update(id: string, user: AuthUser, dto: UpdateRfcDto): Promise<RfcDetail> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true, body: true, slug: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertAuthorOrMaintainer(rfc.authorId, user);

    const data: Prisma.RfcUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;

    if (dto.slug !== undefined) {
      if (rfc.status !== RfcStatus.DRAFT) {
        throw new ConflictException('slug é imutável após a publicação');
      }
      data.slug = await this.resolveSlug(dto.slug, rfc.id);
    }

    let createVersion = false;
    if (dto.body !== undefined && dto.body !== rfc.body) {
      data.body = dto.body;
      createVersion = true;
    }

    return this.prisma.$transaction(async (tx) => {
      if (createVersion && dto.body !== undefined) {
        const last = await tx.rfcVersion.findFirst({
          where: { rfcId: id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        await tx.rfcVersion.create({
          data: {
            rfcId: id,
            version: (last?.version ?? 0) + 1,
            body: dto.body,
            authorId: user.id,
          },
        });
      }

      return tx.rfc.update({
        where: { id },
        data,
        select: RFC_DETAIL_SELECT,
      });
    });
  }

  // ---------- publish ----------

  async publish(id: string, user: AuthUser): Promise<RfcDetail> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertAuthorOrMaintainer(rfc.authorId, user);
    if (rfc.status !== RfcStatus.DRAFT) {
      throw new ConflictException('apenas rascunhos podem ser publicados');
    }

    return this.prisma.$transaction(async (tx) => {
      const [{ nextval }] = await tx.$queryRaw<
        { nextval: bigint }[]
      >`SELECT nextval('rfc_number_seq')`;
      return tx.rfc.update({
        where: { id },
        data: {
          number: Number(nextval),
          status: RfcStatus.IN_DISCUSSION,
          publishedAt: new Date(),
        },
        select: RFC_DETAIL_SELECT,
      });
    });
  }

  // ---------- archive ----------

  async archive(id: string, user: AuthUser): Promise<RfcDetail> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id },
      select: { id: true, authorId: true, status: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    this.assertAuthorOrMaintainer(rfc.authorId, user);

    return this.prisma.rfc.update({
      where: { id },
      data: { status: RfcStatus.ARCHIVED, archivedAt: new Date() },
      select: RFC_DETAIL_SELECT,
    });
  }

  // ---------- helpers ----------

  private assertAuthorOrMaintainer(authorId: string, user: AuthUser): void {
    if (user.id !== authorId && user.role !== UserRole.MAINTAINER) {
      throw new ForbiddenException('apenas o autor pode modificar essa RFC');
    }
  }

  private assertViewerCanSee(
    rfc: { status: RfcStatus; visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'; authorId: string },
    viewer?: AuthUser,
  ): void {
    if (rfc.visibility === 'PUBLIC') {
      // Drafts são privados mesmo com visibility=PUBLIC: só autor/maintainer veem.
      if (rfc.status === RfcStatus.DRAFT) {
        if (!viewer || (viewer.id !== rfc.authorId && viewer.role !== UserRole.MAINTAINER)) {
          throw new NotFoundException('RFC not found');
        }
      }
      return;
    }
    if (rfc.visibility === 'UNLISTED') {
      // unlisted é acessível por link — não filtra.
      return;
    }
    // PRIVATE: só autor + maintainer.
    if (!viewer || (viewer.id !== rfc.authorId && viewer.role !== UserRole.MAINTAINER)) {
      throw new NotFoundException('RFC not found');
    }
  }

  private async resolveSlug(input: string, ignoreRfcId?: string): Promise<string> {
    const provided = isValidSlug(input);
    const baseSlug = provided ? input : slugify(input);

    if (!baseSlug || baseSlug.length < 5) {
      throw new BadRequestException(
        'título não gerou um slug válido — informe slug explicitamente',
      );
    }

    let slug = baseSlug;
    let counter = 2;
    // Procura colisão (excluindo a própria RFC quando estamos editando).
    while (true) {
      const existing = await this.prisma.rfc.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing || existing.id === ignoreRfcId) return slug;
      slug = `${baseSlug}-${counter++}`;
    }
  }
}
