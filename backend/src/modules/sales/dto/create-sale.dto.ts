import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SaleItemDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 80, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @ApiProperty({ example: 5, default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({ example: 2, default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class PaymentDto {
  @ApiProperty({ example: 'cash', enum: ['cash', 'card', 'bank_transfer', 'mobile_money'] })
  @IsString()
  method: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateSaleDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ type: [PaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];

  @ApiProperty({ example: 'Sale notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-v4', required: false })
  @IsOptional()
  @IsString()
  idempotency_key?: string;
}


