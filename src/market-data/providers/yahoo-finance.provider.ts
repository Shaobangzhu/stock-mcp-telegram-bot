import { Injectable } from '@nestjs/common';
import YahooFinance from 'yahoo-finance2';
import { QuoteData, QuoteProvider } from './quote-provider.interface';

type YahooFinanceClient = {
  quote(symbol: string): Promise<unknown>;
};

type YahooQuoteResult = {
  symbol?: string;
  regularMarketPrice?: number | null;
  regularMarketPreviousClose?: number | null;
  regularMarketDayHigh?: number | null;
  regularMarketDayLow?: number | null;
  regularMarketVolume?: number | null;
};

function isYahooQuoteResult(value: unknown): value is YahooQuoteResult {
  return !!value && typeof value === 'object';
}

@Injectable()
export class YahooFinanceProvider implements QuoteProvider {
  private readonly yahooFinanceClient: YahooFinanceClient;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const client: unknown = new YahooFinance();
    this.yahooFinanceClient = client as YahooFinanceClient;
  }

  async getQuote(symbol: string): Promise<QuoteData> {
    try {
      const rawQuote: unknown = await this.yahooFinanceClient.quote(symbol);

      if (!isYahooQuoteResult(rawQuote)) {
        throw new Error('provider returned an invalid quote payload');
      }

      const quote = rawQuote;

      const resolvedSymbol = quote.symbol;
      const price = quote.regularMarketPrice;
      const previousClose = quote.regularMarketPreviousClose;
      const dayHigh = quote.regularMarketDayHigh;
      const dayLow = quote.regularMarketDayLow;
      const volume = quote.regularMarketVolume;

      if (!resolvedSymbol) {
        throw new Error('missing symbol');
      }

      if (price == null) {
        throw new Error('missing regularMarketPrice');
      }

      if (previousClose == null) {
        throw new Error('missing regularMarketPreviousClose');
      }

      if (dayHigh == null) {
        throw new Error('missing regularMarketDayHigh');
      }

      if (dayLow == null) {
        throw new Error('missing regularMarketDayLow');
      }

      if (volume == null) {
        throw new Error('missing regularMarketVolume');
      }

      if (previousClose <= 0) {
        throw new Error('invalid previousClose');
      }

      const changePercent = ((price - previousClose) / previousClose) * 100;

      return {
        symbol: resolvedSymbol,
        price,
        previousClose,
        changePercent,
        dayHigh,
        dayLow,
        volume,
        capturedAt: new Date(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'unknown provider error';

      throw new Error(`Failed to fetch quote for ${symbol}: ${message}`);
    }
  }
}
