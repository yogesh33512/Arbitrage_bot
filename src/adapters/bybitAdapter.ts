import { ExchangeAdapter } from "./exchangeAdapter";
import { bybitService } from "../exchanges";

export class BybitAdapter extends ExchangeAdapter {
  name = "Bybit";

  async getOrderbook(symbol: string) {
    // fetch orderbook using bybit API
    return await bybitService.getOrderBook(symbol);
  }

  async marketBuy(symbol: string, size: number) {
    // execute market buy on bybit
    return await bybitService.marketBuy(symbol, String(size));
  }

  async marketSell(symbol: string, size: number) {
    // execute market sell on bybit
    return await bybitService.marketSell(symbol, String(size));
  }

  async getFees(symbol: string) {
    // return bybit trading fees
    return { taker: 0.001, maker: 0.001 };
  }

  async getBalance(asset: string): Promise<number> {
    // TODO: fetch from bybit account balance API
    console.log(`Fetching balance for ${asset} on Binance`);
    return 1000; // fake balance
  }

  minOrderSize(symbol: string): number {
    // TODO: fetch exchange filters from bybit API (stepSize/lotSize)
    return 0.01; // example min size
  }
}
