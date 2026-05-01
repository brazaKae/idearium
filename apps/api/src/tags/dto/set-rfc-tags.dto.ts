import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class SetRfcTagsDto {
  @ApiProperty({
    type: [String],
    maxItems: 10,
    description:
      'Lista de nomes de tags. Slug é gerado automaticamente. Tags inexistentes são criadas.',
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(40, { each: true })
  tags!: string[];
}
