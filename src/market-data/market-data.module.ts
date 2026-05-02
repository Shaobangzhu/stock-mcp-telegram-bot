import { Module } from '@nestjs/common';
import { AlphaVantageProvider } from './providers/alpha-vantage.provider';
import { QuotesService } from './quotes.service';

@Module({
  providers: [QuotesService, AlphaVantageProvider],
  exports: [QuotesService],
})
export class MarketDataModule {}
