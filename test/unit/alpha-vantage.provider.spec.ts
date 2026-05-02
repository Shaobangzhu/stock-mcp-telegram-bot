import { ConfigService } from '@nestjs/config';
import { AlphaVantageProvider } from '../../src/market-data/providers/alpha-vantage.provider';

type MockFetchResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

const mockFetch = jest.fn<Promise<MockFetchResponse>, [string]>();

describe('AlphaVantageProvider', () => {
  let provider: AlphaVantageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;

    provider = new AlphaVantageProvider({
      getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as ConfigService);
  });

  it('should map Alpha Vantage global quote data into QuoteData', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        'Global Quote': {
          '01. symbol': 'AAPL',
          '03. high': '212.0000',
          '04. low': '198.0000',
          '05. price': '210.0000',
          '06. volume': '123456789',
          '08. previous close': '200.0000',
        },
      }),
    });

    const quote = await provider.getQuote('AAPL');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [requestUrl] = mockFetch.mock.calls[0];
    expect(requestUrl).toContain('function=GLOBAL_QUOTE');
    expect(requestUrl).toContain('symbol=AAPL');
    expect(requestUrl).toContain('entitlement=realtime');
    expect(requestUrl).toContain('apikey=test-api-key');

    expect(quote.symbol).toBe('AAPL');
    expect(quote.price).toBe(210);
    expect(quote.previousClose).toBe(200);
    expect(quote.changePercent).toBe(5);
    expect(quote.dayHigh).toBe(212);
    expect(quote.dayLow).toBe(198);
    expect(quote.volume).toBe(123456789);
    expect(quote.capturedAt).toBeInstanceOf(Date);
  });

  it('should throw when Alpha Vantage quote data is incomplete', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        'Global Quote': {
          '01. symbol': 'AAPL',
          '03. high': '212.0000',
          '04. low': '198.0000',
          '06. volume': '123456789',
          '08. previous close': '200.0000',
        },
      }),
    });

    await expect(provider.getQuote('AAPL')).rejects.toThrow(
      'Failed to fetch quote for AAPL: missing 05. price',
    );
  });

  it('should throw when Alpha Vantage returns an API message', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        Information: 'API key entitlement required',
      }),
    });

    await expect(provider.getQuote('AAPL')).rejects.toThrow(
      'Failed to fetch quote for AAPL: API key entitlement required',
    );
  });
});
