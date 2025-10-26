import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  product_id: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiProperty({ example: 5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ example: 2, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  supplier_id: number;

  @ApiProperty({ example: 'PO-001' })
  @IsString()
  invoice_no: string;

  @ApiProperty({ type: 'string', format: 'date', example: '2024-01-01' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ type: [PurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiProperty({ example: 'Purchase notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}


