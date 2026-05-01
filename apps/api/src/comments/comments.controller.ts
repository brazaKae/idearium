import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('rfcs/:id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lista comentários de uma RFC (cronológica, paginada).' })
  list(
    @Param('id') rfcId: string,
    @Query() query: PaginationQueryDto,
    @OptionalUser() viewer: AuthUser | null,
  ) {
    return this.commentsService.listForRfc(rfcId, query, viewer ?? undefined);
  }

  @Post('rfcs/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria comentário na RFC.' })
  create(@Param('id') rfcId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(rfcId, user, dto);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edita comentário (somente autor). Marca isEdited.' })
  update(
    @Param('id') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, user, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deleta comentário (soft — body vira "[removido]").' })
  softDelete(@Param('id') commentId: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.softDelete(commentId, user);
  }
}
