import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Warehouse' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Storage St', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}


