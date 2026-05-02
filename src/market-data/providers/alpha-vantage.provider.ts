import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuoteData, QuoteProvider } from './quote-provider.interface';

const ALPHA_VANTAGE_QUERY_URL = 'https://www.alphavantage.co/query';

type AlphaVantageGlobalQuote = {
  '01. symbol'?: string;
  '03. high'?: string;
  '04. low'?: string;
  '05. price'?: string;
  '06. volume'?: string;
  '08. previous close'?: string;
};

type AlphaVantageGlobalQuoteResponse = {
  'Global Quote'?: AlphaVantageGlobalQuote;
  'Error Message'?: string;
  Note?: string;
  Information?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isAlphaVantageGlobalQuoteResponse(
  value: unknown,
): value is AlphaVantageGlobalQuoteResponse {
  if (!isRecord(value)) {
    return false;
  }

  const globalQuote = value['Global Quote'];
  return globalQuote === undefined || isRecord(globalQuote);
}

function parseRequiredNumber(
  value: string | undefined,
  fieldName: string,
): number {
  if (value == null || value.trim() === '') {
    throw new Error(`missing ${fieldName}`);
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`invalid ${fieldName}`);
  }

  return parsedValue;
}

@Injectable()
export class AlphaVantageProvider implements QuoteProvider {
  constructor(private readonly configService: ConfigService) {}

  async getQuote(symbol: string): Promise<QuoteData> {
    try {
      const response = await fetch(this.buildQuoteUrl(symbol));

      if (!response.ok) {
        throw new Error(`Alpha Vantage request failed with ${response.status}`);
      }

      const payload: unknown = await response.json();

      if (!isAlphaVantageGlobalQuoteResponse(payload)) {
        throw new Error('provider returned an invalid quote payload');
      }

      if (payload['Error Message']) {
        throw new Error(payload['Error Message']);
      }

      if (payload.Note) {
        throw new Error(payload.Note);
      }

      if (payload.Information) {
        throw new Error(payload.Information);
      }

      const quote = payload['Global Quote'];

      if (!quote) {
        throw new Error('missing Global Quote');
      }

      const resolvedSymbol = quote['01. symbol'];

      if (!resolvedSymbol) {
        throw new Error('missing 01. symbol');
      }

      const price = parseRequiredNumber(quote['05. price'], '05. price');
      const previousClose = parseRequiredNumber(
        quote['08. previous close'],
        '08. previous close',
      );
      const dayHigh = parseRequiredNumber(quote['03. high'], '03. high');
      const dayLow = parseRequiredNumber(quote['04. low'], '04. low');
      const volume = parseRequiredNumber(quote['06. volume'], '06. volume');

      if (previousClose <= 0) {
        throw new Error('invalid 08. previous close');
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'unknown provider error';

      throw new Error(`Failed to fetch quote for ${symbol}: ${message}`);
    }
  }

  private buildQuoteUrl(symbol: string): string {
    const params = new URLSearchParams({
      function: 'GLOBAL_QUOTE',
      symbol,
      entitlement: 'realtime',
      apikey: this.configService.getOrThrow<string>('ALPHA_VANTAGE_API_KEY'),
    });

    return `${ALPHA_VANTAGE_QUERY_URL}?${params.toString()}`;
  }
}
