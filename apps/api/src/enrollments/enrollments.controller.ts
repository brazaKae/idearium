import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('rfcs/:id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscreve o usuário autenticado como builder/reviewer/lead na RFC.' })
  enroll(
    @Param('id') rfcId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.enroll(rfcId, user, dto);
  }

  @Delete('rfcs/:id/enroll')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sai da RFC (soft — marca leftAt).' })
  leave(@Param('id') rfcId: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentsService.leave(rfcId, user);
  }

  @Get('rfcs/:id/enrollments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lista inscrições ativas em uma RFC.' })
  listForRfc(@Param('id') rfcId: string, @OptionalUser() viewer: AuthUser | null) {
    return this.enrollmentsService.listForRfc(rfcId, viewer ?? undefined);
  }

  @Get('users/:username/enrollments')
  @ApiOperation({ summary: 'Lista RFCs em que o usuário está inscrito (somente públicas).' })
  listForUser(@Param('username') username: string, @Query() query: PaginationQueryDto) {
    return this.enrollmentsService.listForUser(username.toLowerCase(), query);
  }
}
