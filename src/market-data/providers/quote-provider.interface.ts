export interface QuoteData {
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  capturedAt: Date;
}

export interface QuoteProvider {
  getQuote(symbol: string): Promise<QuoteData>;
}
