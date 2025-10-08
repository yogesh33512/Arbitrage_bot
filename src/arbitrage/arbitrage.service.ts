import { ExchangeAdapter, ArbOpportunity } from "./arbitrage.types";
import { orderBooks } from "../orderBooks/orderbooks";
import chalk from "chalk";

class Arbitration {
  constructor() {
    console.log(chalk.cyanBright("[Arbitration] Initialized arbitration instance"));
  }

  async evaluateArbitrarge(
    buyEx: ExchangeAdapter,
    sellEx: ExchangeAdapter,
    symbol: string,
    size: number
  ): Promise<ArbOpportunity | null> {
    console.log(chalk.whiteBright(`\n[evaluateArbitrarge]🔍 Evaluating ${chalk.yellow(symbol)} | Size: ${chalk.yellow(size)}`));
    console.log(chalk.whiteBright(`Checking buy ↔️  on ${chalk.yellowBright(buyEx.name)} and -> sell on ${chalk.yellowBright(sellEx.name)}`));

    const buyBook = await buyEx.getOrderbook(symbol);
    buyBook.asks.sort((a, b) => a[0] - b[0]);
    console.log(chalk.whiteBright(`[evaluateArbitrarge] Buy orderbook fetched. Top 3 asks:`, chalk.yellowBright(buyBook.asks.slice(0, 3))));
    // console.log("buybook---------->",buyBook);

    const sellBook = await sellEx.getOrderbook(symbol);
    console.log(chalk.whiteBright(`[evaluateArbitrarge] Sell orderbook fetched. Top 3 bids:`, chalk.yellowBright(sellBook.bids.slice(0, 3))));
    // console.log("sellbook------------>",sellBook);

    const buyEst = await orderBooks.avgPriceFromBook(buyBook.asks, size);
    console.log(chalk.whiteBright(`[evaluateArbitrarge] Estimated buy price:`, chalk.yellowBright(JSON.stringify(buyEst))));

    const sellEst = await orderBooks.avgPriceFromBook(sellBook.bids, size);
    console.log(chalk.whiteBright(`[evaluateArbitrarge] Estimated sell price:`, chalk.yellowBright(JSON.stringify(sellEst))));

    if (!isFinite(buyEst.avgPrice) || !isFinite(sellEst.avgPrice)) {
      console.log(chalk.whiteBright("⚠️ [evaluateArbitrarge] Invalid avg price, skipping arbitrage"));
      return null;
    }

    const buyFee = (await buyEx.getFees(symbol)).taker;
    const sellFee = (await sellEx.getFees(symbol)).taker;
    console.log(chalk.whiteBright(`[evaluateArbitrarge]💰 Buy Fee: ${chalk.yellowBright(buyFee)}, Sell Fee: ${chalk.yellowBright(sellFee)}`));

    const { netProfit, roi, cost, proceeds } = await orderBooks.calculateProfit(
      buyEst.avgPrice,
      sellEst.avgPrice,
      size,
      buyFee,
      sellFee
    );

    console.log(chalk.whiteBright(`[evaluateArbitrarge] Calculated Profit: Net=${chalk.yellowBright(netProfit)}, ROI=${chalk.yellowBright(roi)}%\n`));

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
    console.log(chalk.whiteBright(`[ArbitrationScanner] Scanning opportunities for ${chalk.yellowBright(symbol)} | Size: ${chalk.yellowBright(size)}`));

    const opportunity: ArbOpportunity[] = [];

    for (let i = 0; i < exchanges.length; i++) {
      for (let j = 0; j < exchanges.length; j++) {
        if (i === j) continue;
        console.log("\n===========================================================================\n");
        console.log(chalk.whiteBright(`\n[ArbitrationScanner] Evaluating pair: Buy ${chalk.yellowBright(exchanges[i].name)}, Sell ${chalk.yellowBright(exchanges[j].name)}`));
        const arb = await this.evaluateArbitrarge(exchanges[i], exchanges[j], symbol, size);

        if (arb && arb.netProfit >= profitHtreshold) {
          console.log(chalk.whiteBright(`[ArbitrationScanner]🎯 Arbitrage opportunity found! Net Profit: ${chalk.yellowBright(arb.netProfit)}\n`));
          opportunity.push(arb);      
        }
      }
      console.log("========================================================================\n")
    }

    console.log(chalk.whiteBright(`[ArbitrationScanner] Total opportunities found: ${chalk.yellowBright(opportunity.length)}`));
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
