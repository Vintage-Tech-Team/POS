import { IsArray, IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class JournalEntryDto {
  @ApiProperty({ example: 1 })
  account_id: number;

  @ApiProperty({ example: 100 })
  debit: number;

  @ApiProperty({ example: 0 })
  credit: number;

  @ApiProperty({ example: 'Payment received', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalVoucherDto {
  @ApiProperty({ type: 'string', format: 'date', example: '2024-01-01' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ type: [JournalEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryDto)
  entries: JournalEntryDto[];

  @ApiProperty({ example: 'Manual adjustment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}


