import YahooFinance from 'yahoo-finance2';
import { YahooFinanceProvider } from '../../src/market-data/providers/yahoo-finance.provider';

jest.mock('yahoo-finance2');

const mockQuote = jest.fn();
const MockedYahooFinance = YahooFinance as unknown as jest.Mock;

describe('YahooFinanceProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    MockedYahooFinance.mockImplementation(() => ({
      quote: mockQuote,
    }));
  });

  it('should map upstream quote data into QuoteData', async () => {
    mockQuote.mockResolvedValue({
      symbol: 'AAPL',
      regularMarketPrice: 210,
      regularMarketPreviousClose: 200,
      regularMarketDayHigh: 212,
      regularMarketDayLow: 198,
      regularMarketVolume: 123456789,
    });

    const provider = new YahooFinanceProvider();
    const quote = await provider.getQuote('AAPL');

    expect(mockQuote).toHaveBeenCalledWith('AAPL');

    expect(quote.symbol).toBe('AAPL');
    expect(quote.price).toBe(210);
    expect(quote.previousClose).toBe(200);
    expect(quote.changePercent).toBe(5);
    expect(quote.dayHigh).toBe(212);
    expect(quote.dayLow).toBe(198);
    expect(quote.volume).toBe(123456789);
    expect(quote.capturedAt).toBeInstanceOf(Date);
  });

  it('should throw when upstream quote data is incomplete', async () => {
    mockQuote.mockResolvedValue({
      symbol: 'AAPL',
      regularMarketPreviousClose: 200,
      regularMarketDayHigh: 212,
      regularMarketDayLow: 198,
      regularMarketVolume: 123456789,
    });

    const provider = new YahooFinanceProvider();

    await expect(provider.getQuote('AAPL')).rejects.toThrow(
      'Failed to fetch quote for AAPL: missing regularMarketPrice',
    );
  });
});
