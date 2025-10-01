import { ExchangeAdapter, ArbOpportunity } from "./arbitrage.types";
import { orderBooks } from "../orderBooks/orderbooks";

class Arbitration {
  constructor() {
    console.log("[Arbitration] Initialized arbitration instance");
  }

  async evaluateArbitrarge(
    buyEx: ExchangeAdapter,
    sellEx: ExchangeAdapter,
    symbol: string,
    size: number
  ): Promise<ArbOpportunity | null> {
    console.log(`[evaluateArbitrarge] Evaluating ${symbol} | Size: ${size}`);
    console.log(`Checking buy on ${buyEx.name} and sell on ${sellEx.name}`);

    const buyBook = await buyEx.getOrderbook(symbol);
    console.log(`[evaluateArbitrarge] Buy orderbook fetched. Top 3 asks:`, buyBook.asks.slice(0, 3));
    console.log(buyBook);

    const sellBook = await sellEx.getOrderbook(symbol);
    console.log(`[evaluateArbitrarge] Sell orderbook fetched. Top 3 bids:`, sellBook.bids.slice(0, 3));
    console.log(sellBook);

    const buyEst = await orderBooks.avgPriceFromBook(buyBook.asks, size);
    console.log(`[evaluateArbitrarge] Estimated buy price:`, buyEst);

    const sellEst = await orderBooks.avgPriceFromBook(sellBook.bids, size);
    console.log(`[evaluateArbitrarge] Estimated sell price:`, sellEst);

    if (!isFinite(buyEst.avgPrice) || !isFinite(sellEst.avgPrice)) {
      console.log("[evaluateArbitrarge] Invalid avg price, skipping arbitrage");
      return null;
    }

    const buyFee = (await buyEx.getFees(symbol)).taker;
    const sellFee = (await sellEx.getFees(symbol)).taker;
    console.log(`[evaluateArbitrarge] Buy Fee: ${buyFee}, Sell Fee: ${sellFee}`);

    const { netProfit, roi, cost, proceeds } = await orderBooks.calculateProfit(
      buyEst.avgPrice,
      sellEst.avgPrice,
      size,
      buyFee,
      sellFee
    );

    console.log(`[evaluateArbitrarge] Calculated Profit: Net=${netProfit}, ROI=${roi}%`);

    return {
      buyExchange: buyEx,
      sellExchange: sellEx,
      symbol,
      size,
      netProfit,
      roi,
      cost,
      proceeds,
    };
  }

  async ArbitrationScanner(
    exchanges: ExchangeAdapter[],
    symbol: string,
    size: number,
    profitHtreshold = 0.5
  ): Promise<ArbOpportunity[]> {
    console.log(`[ArbitrationScanner] Scanning opportunities for ${symbol} | Size: ${size}`);

    const opportunity: ArbOpportunity[] = [];

    for (let i = 0; i < exchanges.length; i++) {
      for (let j = 0; j < exchanges.length; j++) {
        if (i === j) continue;

        console.log(`[ArbitrationScanner] Evaluating pair: Buy ${exchanges[i].name}, Sell ${exchanges[j].name}`);
        const arb = await this.evaluateArbitrarge(exchanges[i], exchanges[j], symbol, size);

        if (arb && arb.netProfit >= profitHtreshold) {
          console.log(`[ArbitrationScanner] Arbitrage opportunity found! Net Profit: ${arb.netProfit}`);
          opportunity.push(arb);
        }
      }
    }

    console.log(`[ArbitrationScanner] Total opportunities found: ${opportunity.length}`);
    return opportunity;
  }

  async arbitrargeExecution(op: ArbOpportunity) {
    console.log(`[arbitrargeExecution] Executing arbitrage: Buy ${op.size} ${op.symbol} on ${op.buyExchange.name}, Sell on ${op.sellExchange.name}`);

    try {
      const [buyRes, sellRes] = await Promise.all([
        op.buyExchange.marketBuy(op.symbol, op.size),
        op.sellExchange.marketSell(op.symbol, op.size),
      ]);

      console.log("[arbitrargeExecution] Buy Result:", buyRes);
      console.log("[arbitrargeExecution] Sell Result:", sellRes);

      return { buyRes, sellRes };
    } catch (err) {
      console.error("[arbitrargeExecution] Error executing arbitrage:", err);
      throw err;
    }
  }
}

export const arbitration = new Arbitration();
