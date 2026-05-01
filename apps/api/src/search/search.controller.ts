import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchQueryDto } from './dto/search.query.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Busca textual em RFCs (FTS bilíngue). Filtra por locale e lab.',
  })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}
