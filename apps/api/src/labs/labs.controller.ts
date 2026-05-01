import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LabsService } from './labs.service';

@ApiTags('labs')
@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os laboratórios ativos com contadores.' })
  list() {
    return this.labsService.list();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalhes de um laboratório pelo slug.' })
  bySlug(@Param('slug') slug: string) {
    return this.labsService.findBySlug(slug);
  }
}
