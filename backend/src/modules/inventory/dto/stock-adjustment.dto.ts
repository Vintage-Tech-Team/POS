import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StockAdjustmentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  product_id: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  warehouse_id?: number;

  @ApiProperty({ example: 10, description: 'Positive to increase, negative to decrease' })
  @IsNumber()
  qty_change: number;

  @ApiProperty({ example: 'Damaged stock removed' })
  @IsString()
  reason: string;
}


