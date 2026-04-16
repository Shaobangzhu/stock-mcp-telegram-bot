import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWatchlistItemDto {
  @IsString()
  @MaxLength(10)
  symbol: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;
}
