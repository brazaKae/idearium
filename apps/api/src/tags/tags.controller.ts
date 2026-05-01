import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { SetRfcTagsDto } from './dto/set-rfc-tags.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tags')
  @ApiOperation({ summary: 'Lista tags ordenadas por uso (decrescente).' })
  list(@Query() query: PaginationQueryDto) {
    return this.tagsService.list(query);
  }

  @Get('tags/:slug')
  @ApiOperation({ summary: 'Tag + RFCs públicas com essa tag.' })
  findBySlug(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.tagsService.findBySlug(slug.toLowerCase(), query);
  }

  @Get('rfcs/:id/tags')
  @ApiOperation({ summary: 'Tags atuais de uma RFC.' })
  listForRfc(@Param('id') rfcId: string) {
    return this.tagsService.listForRfc(rfcId);
  }

  @Post('rfcs/:id/tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Define o set completo de tags de uma RFC (autor only). Substitui as anteriores.',
  })
  setForRfc(@Param('id') rfcId: string, @CurrentUser() user: AuthUser, @Body() dto: SetRfcTagsDto) {
    return this.tagsService.setForRfc(rfcId, user, dto);
  }
}
