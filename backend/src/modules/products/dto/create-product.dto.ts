import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Sample Product' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  category_id?: number;

  @ApiProperty({ example: 'pcs', default: 'pcs' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  purchase_price: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @Min(0)
  sale_price: number;

  @ApiProperty({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_percent?: number;

  @ApiProperty({ example: 100, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @ApiProperty({ example: 10, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_level?: number;

  @ApiProperty({ example: 'Product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'http://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}


