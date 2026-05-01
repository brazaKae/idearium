import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentRole, Prisma, PrismaClient, RfcStatus, Visibility } from '@prisma/client';
import { buildPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

const ENROLLMENT_PUBLIC_SELECT = {
  id: true,
  role: true,
  message: true,
  createdAt: true,
  leftAt: true,
  user: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
} satisfies Prisma.EnrollmentSelect;

const USER_RFC_LIST_SELECT = {
  id: true,
  number: true,
  slug: true,
  title: true,
  summary: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  lab: { select: { id: true, slug: true, name: true, glyph: true } },
} satisfies Prisma.RfcSelect;

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- enroll ----------

  async enroll(rfcId: string, user: AuthUser, dto: CreateEnrollmentDto) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true, status: true, visibility: true, authorId: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');

    if (rfc.status === RfcStatus.DRAFT || rfc.status === RfcStatus.ARCHIVED) {
      throw new ConflictException(
        rfc.status === RfcStatus.DRAFT
          ? 'cannot enroll on a draft RFC'
          : 'cannot enroll on an archived RFC',
      );
    }

    if (rfc.visibility === Visibility.PRIVATE && user.id !== rfc.authorId) {
      throw new NotFoundException('RFC not found');
    }

    const role = dto.role ?? EnrollmentRole.BUILDER;

    const result = await this.prisma.$transaction(async (tx) => {
      // upsert: se já existe (mesmo com leftAt setado), reativa. Se ativo → 409.
      const existing = await tx.enrollment.findUnique({
        where: { rfcId_userId: { rfcId, userId: user.id } },
      });

      if (existing && existing.leftAt === null) {
        throw new ConflictException('already enrolled');
      }

      const enrollment = existing
        ? await tx.enrollment.update({
            where: { id: existing.id },
            data: { role, message: dto.message ?? null, leftAt: null },
            select: ENROLLMENT_PUBLIC_SELECT,
          })
        : await tx.enrollment.create({
            data: {
              rfcId,
              userId: user.id,
              role,
              message: dto.message ?? null,
            },
            select: ENROLLMENT_PUBLIC_SELECT,
          });

      await this.recomputeRfcStatus(tx, rfcId);

      return enrollment;
    });

    return result;
  }

  // ---------- leave ----------

  async leave(rfcId: string, user: AuthUser): Promise<{ success: true }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { rfcId_userId: { rfcId, userId: user.id } },
    });
    if (!enrollment || enrollment.leftAt !== null) {
      throw new NotFoundException('not currently enrolled');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { leftAt: new Date() },
      });
      await this.recomputeRfcStatus(tx, rfcId);
    });

    return { success: true };
  }

  // ---------- list (per RFC) ----------

  async listForRfc(rfcId: string, viewer?: AuthUser) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true, status: true, visibility: true, authorId: true },
    });
    if (!rfc) throw new NotFoundException('RFC not found');
    if (!this.canSeeRfc(rfc, viewer)) {
      throw new NotFoundException('RFC not found');
    }

    return this.prisma.enrollment.findMany({
      where: { rfcId, leftAt: null },
      select: ENROLLMENT_PUBLIC_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  // ---------- list (per user) ----------

  async listForUser(
    username: string,
    query: PaginationQueryDto,
  ): Promise<
    PaginatedResult<{
      rfc: Prisma.RfcGetPayload<{ select: typeof USER_RFC_LIST_SELECT }>;
      role: EnrollmentRole;
      createdAt: Date;
    }>
  > {
    const user = await this.prisma.user.findFirst({
      where: { username, isActive: true },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('user not found');

    const where: Prisma.EnrollmentWhereInput = {
      userId: user.id,
      leftAt: null,
      rfc: {
        visibility: Visibility.PUBLIC,
        status: { not: RfcStatus.DRAFT },
      },
    };

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        select: {
          role: true,
          createdAt: true,
          rfc: { select: USER_RFC_LIST_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return buildPaginatedResult(enrollments, total, query.page, query.limit);
  }

  // ---------- helpers ----------

  private canSeeRfc(
    rfc: { status: RfcStatus; visibility: Visibility; authorId: string },
    viewer?: AuthUser,
  ): boolean {
    if (rfc.visibility === Visibility.PUBLIC) {
      // drafts visíveis só ao autor (e maintainer global, mas aqui só consideramos autor)
      if (rfc.status === RfcStatus.DRAFT) {
        return !!viewer && viewer.id === rfc.authorId;
      }
      return true;
    }
    if (rfc.visibility === Visibility.UNLISTED) return true;
    // PRIVATE
    return !!viewer && viewer.id === rfc.authorId;
  }

  /**
   * Bumps RFC status entre IN_DISCUSSION ↔ IN_BUILDING conforme presença de
   * builders ativos. Não muda status terminal (PUBLISHED, ARCHIVED).
   */
  private async recomputeRfcStatus(
    tx: Prisma.TransactionClient | PrismaClient,
    rfcId: string,
  ): Promise<void> {
    const rfc = await tx.rfc.findUnique({
      where: { id: rfcId },
      select: { status: true },
    });
    if (!rfc) return;
    if (rfc.status !== RfcStatus.IN_DISCUSSION && rfc.status !== RfcStatus.IN_BUILDING) {
      return;
    }

    const activeBuilders = await tx.enrollment.count({
      where: { rfcId, leftAt: null, role: EnrollmentRole.BUILDER },
    });

    const targetStatus = activeBuilders > 0 ? RfcStatus.IN_BUILDING : RfcStatus.IN_DISCUSSION;

    if (rfc.status !== targetStatus) {
      await tx.rfc.update({
        where: { id: rfcId },
        data: { status: targetStatus },
      });
    }
  }
}
