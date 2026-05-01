import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RfcStatus, UserRole, Visibility } from '@prisma/client';
import { buildPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const REMOVED_PLACEHOLDER = '[removido]';

const COMMENT_RAW_SELECT = {
  id: true,
  body: true,
  isEdited: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true, fullName: true, avatarUrl: true } },
} satisfies Prisma.CommentSelect;

type RawComment = Prisma.CommentGetPayload<{ select: typeof COMMENT_RAW_SELECT }>;

const presentComment = (c: RawComment) => ({
  ...c,
  body: c.isDeleted ? REMOVED_PLACEHOLDER : c.body,
});

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForRfc(
    rfcId: string,
    query: PaginationQueryDto,
    viewer?: AuthUser,
  ): Promise<PaginatedResult<ReturnType<typeof presentComment>>> {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true, status: true, visibility: true, authorId: true },
    });
    if (!rfc || !this.canSeeRfc(rfc, viewer)) {
      throw new NotFoundException('RFC not found');
    }

    const where: Prisma.CommentWhereInput = { rfcId };

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        select: COMMENT_RAW_SELECT,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return buildPaginatedResult(data.map(presentComment), total, query.page, query.limit);
  }

  async create(rfcId: string, user: AuthUser, dto: CreateCommentDto) {
    const rfc = await this.prisma.rfc.findUnique({
      where: { id: rfcId },
      select: { id: true, status: true, visibility: true, authorId: true },
    });
    if (!rfc || !this.canSeeRfc(rfc, user)) {
      throw new NotFoundException('RFC not found');
    }
    if (rfc.status === RfcStatus.ARCHIVED) {
      throw new ForbiddenException('cannot comment on archived RFCs');
    }

    const created = await this.prisma.comment.create({
      data: {
        rfcId,
        authorId: user.id,
        body: dto.body,
      },
      select: COMMENT_RAW_SELECT,
    });

    return presentComment(created);
  }

  async update(commentId: string, user: AuthUser, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, isDeleted: true, body: true },
    });
    if (!comment) throw new NotFoundException('comment not found');
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('apenas o autor pode editar o comentário');
    }
    if (comment.isDeleted) {
      throw new ForbiddenException('cannot edit a deleted comment');
    }

    if (dto.body === comment.body) {
      // no-op: não marca isEdited
      const fresh = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: COMMENT_RAW_SELECT,
      });
      return presentComment(fresh!);
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body, isEdited: true },
      select: COMMENT_RAW_SELECT,
    });

    return presentComment(updated);
  }

  async softDelete(commentId: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, isDeleted: true },
    });
    if (!comment) throw new NotFoundException('comment not found');
    if (comment.authorId !== user.id && user.role !== UserRole.MAINTAINER) {
      throw new ForbiddenException('apenas o autor (ou maintainer) pode deletar');
    }
    if (comment.isDeleted) {
      return { success: true };
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    return { success: true };
  }

  // ---------- helpers ----------

  private canSeeRfc(
    rfc: { status: RfcStatus; visibility: Visibility; authorId: string },
    viewer?: AuthUser,
  ): boolean {
    if (rfc.visibility === Visibility.PUBLIC) {
      if (rfc.status === RfcStatus.DRAFT) {
        return !!viewer && (viewer.id === rfc.authorId || viewer.role === UserRole.MAINTAINER);
      }
      return true;
    }
    if (rfc.visibility === Visibility.UNLISTED) return true;
    return !!viewer && (viewer.id === rfc.authorId || viewer.role === UserRole.MAINTAINER);
  }
}
