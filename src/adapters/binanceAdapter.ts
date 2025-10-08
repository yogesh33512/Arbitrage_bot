import { ExchangeAdapter } from "./exchangeAdapter";
import { binanceService } from "../exchanges";

export class BinanceAdapter extends ExchangeAdapter {
  
  name = "Binance"  
    
  async getOrderbook(symbol: string) {
    // fetch orderbook using Binance API
    return await binanceService.getOrderBook(symbol);
  }

  async marketBuy(symbol: string, size: number) {
    // execute market buy on Binance
    return await binanceService.marketBuy(symbol, size);
  }

  async marketSell(symbol: string, size: number) {
    // execute market sell on Binance
    return await binanceService.marketSell(symbol, size);
  }

  async getFees(symbol: string) {
    // return Binance trading fees
    return { taker: 0.001, maker: 0.001 }; // it is on discount 0.00075
  }

  async getBalance(asset: string): Promise<number> {
    // TODO: fetch from Binance account balance API
    console.log(`Fetching balance for ${asset} on Binance`);
    return 1000; // fake balance
  }

  minOrderSize(symbol: string): number {
    // TODO: fetch exchange filters from Binance API (stepSize/lotSize)
    return 0.01; // example min size
  }
}
