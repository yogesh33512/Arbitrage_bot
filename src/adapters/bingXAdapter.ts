import { ExchangeAdapter } from "./exchangeAdapter";
import { bingxService } from "../exchanges";

export class BingXAdapter extends ExchangeAdapter {
  name = "Bingx";

  async getOrderbook(symbol: string) {
    // fetch orderbook using Bingx API
    return await bingxService.getOrderbook(symbol);
  }

  async marketBuy(symbol: string, size: number) {
    // execute market buy on Bingx
    return await bingxService.marketBuy(symbol, size);
  }

  async marketSell(symbol: string, size: number) {
    // execute market sell on Bingx
    return await bingxService.marketSell(symbol, size);
  }

  async getFees(symbol: string) {
    // return Bingx trading fees
    return { taker: 0.001, maker: 0.0005 };
  }

  async getBalance(asset: string): Promise<number> {
    // TODO: fetch from Bingx account balance API
    console.log(`Fetching balance for ${asset} on Bingx`);
    return 1000; // fake balance
  }

  minOrderSize(symbol: string): number {
    // TODO: fetch exchange filters from Bingx API (stepSize/lotSize)
    return 0.01; // example min size
  }
}
