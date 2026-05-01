import {
  Body,
  Controller,
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
import type { AuthUser } from '../common/types/auth.types';
import { CreateRfcDto } from './dto/create-rfc.dto';
import { ListRfcsQueryDto } from './dto/list-rfcs.query.dto';
import { UpdateRfcDto } from './dto/update-rfc.dto';
import { RfcsService } from './rfcs.service';

@ApiTags('rfcs')
@Controller('rfcs')
export class RfcsController {
  constructor(private readonly rfcsService: RfcsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova RFC como DRAFT.' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRfcDto) {
    return this.rfcsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista RFCs públicas (alimenta o feed).' })
  list(@Query() query: ListRfcsQueryDto) {
    return this.rfcsService.list(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Top 3 RFCs em destaque para a home.' })
  featured() {
    return this.rfcsService.featured();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Detalhe completo de uma RFC pelo slug.' })
  bySlug(@Param('slug') slug: string, @OptionalUser() viewer: AuthUser | null) {
    return this.rfcsService.findBySlug(slug, viewer ?? undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma RFC. Mudança de body cria nova versão.' })
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRfcDto) {
    return this.rfcsService.update(id, user, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publica DRAFT (atribui número RFC-XXXX e abre discussão).' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rfcsService.publish(id, user);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Arquiva uma RFC.' })
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.rfcsService.archive(id, user);
  }

  @Get(':id/versions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Histórico de versões da RFC (mais recente primeiro).' })
  versions(@Param('id') id: string, @OptionalUser() viewer: AuthUser | null) {
    return this.rfcsService.listVersions(id, viewer ?? undefined);
  }
}
