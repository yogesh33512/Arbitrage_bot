export abstract class ExchangeAdapter {
  abstract getOrderbook(symbol: string): Promise<{ bids: [number, number][]; asks: [number, number][] }>;
  abstract marketBuy(symbol: string, size: number): Promise<any>;
  abstract marketSell(symbol: string, size: number): Promise<any>;
  abstract getFees(symbol: string): Promise<{ taker: number; maker: number }>;
}
