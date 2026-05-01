import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth.types';
import { BuildersService } from './builders.service';
import { ListBuildersQueryDto } from './dto/list-builders.query.dto';
import { UpsertBuilderProfileDto } from './dto/upsert-builder-profile.dto';

@ApiTags('builders')
@Controller('builders')
export class BuildersController {
  constructor(private readonly buildersService: BuildersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista builders disponíveis (sidebar "builders em busca").' })
  list(@Query() query: ListBuildersQueryDto) {
    return this.buildersService.list(query);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria ou atualiza o BuilderProfile do usuário autenticado.' })
  upsertMe(@CurrentUser() user: AuthUser, @Body() dto: UpsertBuilderProfileDto) {
    return this.buildersService.upsertSelf(user.id, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Retorna o BuilderProfile público de um usuário.' })
  byUsername(@Param('username') username: string) {
    return this.buildersService.findByUsername(username.toLowerCase());
  }
}
