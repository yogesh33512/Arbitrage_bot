import { ExchangeAdapter } from "./exchangeAdapter";
import { mexcService } from "../exchanges";
import { exchangeQuoteSymbol } from "../exchanges/mexc/mexc.types";

export class MexcAdapter extends ExchangeAdapter {
  name = "Mexc";

  async getOrderbook(symbol: string) {
    // fetch orderbook using Mexc API
    return await mexcService.getOrderBooks(symbol);
  }

  async marketBuy(symbol: exchangeQuoteSymbol, size: number) {
    // execute market buy on Mexc
    return await mexcService.marketBuy(symbol, String(size));
  }

  async marketSell(symbol: exchangeQuoteSymbol, size: number) {
    // execute market sell on Mexc
    return await mexcService.marketSell(symbol, String(size));
  }

  async getFees(symbol: string) {
    // return Mexc trading fees
    return { taker: 0.005, maker: 0.00 };
  }

  async getBalance(asset: string): Promise<number> {
    // TODO: fetch from Mexc account balance API
    console.log(`Fetching balance for ${asset} on Bingx`);
    return 1000; // fake balance
  }

  minOrderSize(symbol: string): number {
    // TODO: fetch exchange filters from Mexc API (stepSize/lotSize)
    return 0.01; // example min size
  }
}
