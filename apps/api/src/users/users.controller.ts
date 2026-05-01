import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthUser } from '../common/types/auth.types';
import { RfcsService } from '../rfcs/rfcs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rfcsService: RfcsService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o perfil completo do usuário autenticado.' })
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findSelf(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza dados do perfil do usuário autenticado.' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateSelf(user.id, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Retorna o perfil público de um usuário.' })
  byUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username.toLowerCase());
  }

  @Get(':username/rfcs')
  @ApiOperation({ summary: 'RFCs (públicas, não-DRAFT) escritas pelo usuário.' })
  authoredRfcs(@Param('username') username: string, @Query() query: PaginationQueryDto) {
    return this.rfcsService.listAuthoredBy(username.toLowerCase(), query.page, query.limit);
  }
}
