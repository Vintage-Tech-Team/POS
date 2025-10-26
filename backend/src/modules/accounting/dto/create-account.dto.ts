import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../entities/chart-of-account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: '1000' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Cash in Hand' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  parent_id?: number;
}


