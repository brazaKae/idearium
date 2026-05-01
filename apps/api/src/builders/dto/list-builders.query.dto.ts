import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
};

export class ListBuildersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por um tópico do BuilderProfile.',
    example: 'cultura',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  topic?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isOpenToWork?: boolean;
}
