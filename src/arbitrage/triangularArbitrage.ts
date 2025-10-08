import { ExchangeAdapter } from "./arbitrage.types";
import { Orderbook } from "../orderBooks/ordrbooks.types";
import { exchangeSymbols } from "../paths/symbols";
import { basePaths, generateCrossExchangePaths } from "../paths/paths";
import {
  BinanceAdapter,
  BingXAdapter,
  MexcAdapter,
  BybitAdapter,
} from "../adapters";
import chalk from "chalk";

export class TriangularArbitrage {
  private allExchanges: Record<string, ExchangeAdapter>;
  private feasibleTradingPaths: {
    exchange: string;
    symbol: string;
    direction: string;
  }[][] = [];
  constructor() {
    this.allExchanges = {
      Binance: new BinanceAdapter(),
      BingX: new BingXAdapter(),
      MEXC: new MexcAdapter(),
      Bybit: new BybitAdapter(),
      //okx: ExchangeAdapter,
    };
  }

  private async isOrderbookEmpty(orderbook:{bids:[number,number][],asks:[number, number][]}){
    return (orderbook.asks.length === 0 || orderbook.bids.length === 0)
  } 

  async findOpportunity() {
    this.feasibleTradingPaths = await generateCrossExchangePaths(
      exchangeSymbols,
      basePaths
    );
    // console.log(this.feasibleTradingPaths);
    console.log(`Looking for opportunities in a triangular abitrarge across different exchanges`)
    for (let i = 0; i < this.feasibleTradingPaths.length; i++) {
      console.log(`\n==============================`);

      //Getting trade exchanges
      const firstExchangeName = this.feasibleTradingPaths[i][0].exchange;
      const secondExchangeName = this.feasibleTradingPaths[i][1].exchange;
      const thirdExchangeName = this.feasibleTradingPaths[i][2].exchange;

      const firstExchange = this.allExchanges[firstExchangeName];
      const secondExchange = this.allExchanges[secondExchangeName];
      const thirdExchange = this.allExchanges[thirdExchangeName];

      console.log(chalk.whiteBright(`Exchanges involved in the trade: ${chalk.yellowBright(firstExchange.name)}, ${chalk.yellowBright(secondExchange.name)} , ${chalk.yellowBright(thirdExchange.name)}`));

      //getting trade symbols

      const firstTradeSymbol = this.feasibleTradingPaths[i][0].symbol;
      const secondTradeSymbol = this.feasibleTradingPaths[i][1].symbol;
      const thirdTradeSymbol = this.feasibleTradingPaths[i][2].symbol;
      console.log(chalk.whiteBright(`trade symbols involved in the trade: ${chalk.yellowBright(firstTradeSymbol)}, ${chalk.yellowBright(secondTradeSymbol)}, ${chalk.yellowBright(thirdTradeSymbol)}`));

      console.log(chalk.whiteBright(
        `🔍 Checking triangular arbitrage on: ${chalk.yellowBright(firstExchange.name)}, ${chalk.yellowBright(secondExchange.name)}, ${chalk.yellowBright(thirdExchange.name)}`
      ));
      console.log(
        `=============Finding Opportunity ${i + 1} =================\n`
      );

      // Step 1: Fetch orderbooks
      console.log("📥 Fetching orderbooks...");

      //Orderbook 1
      console.log(chalk.whiteBright(
        `Getting order books for: ${chalk.yellowBright(firstTradeSymbol)} on ${chalk.yellowBright(firstExchange.name)}`
      ));
      const firstOrderbook: Orderbook = await firstExchange.getOrderbook(
        firstTradeSymbol
      );

      if(await this.isOrderbookEmpty(firstOrderbook)) continue; // skip trade

      console.log(chalk.whiteBright(
        `[${chalk.yellowBright(firstExchange.name)}] ${chalk.yellowBright(firstTradeSymbol)} | Best Ask: ${chalk.yellowBright(firstOrderbook.asks[0][0])} (qty: ${chalk.yellowBright(firstOrderbook.asks[0][1])}) | ` +
          `Best Bid: ${chalk.yellowBright(firstOrderbook.bids[0][0])} (qty: ${chalk.yellowBright(firstOrderbook.bids[0][1])})`
      ));

      //Orderbook 2

      console.log(chalk.whiteBright(
        `Getting order books for: ${chalk.yellowBright(secondTradeSymbol)} on ${chalk.yellowBright(secondExchange.name)}`
      ));

      const secondOrderbook: Orderbook = await secondExchange.getOrderbook(
        secondTradeSymbol
      );

      if(await this.isOrderbookEmpty(secondOrderbook)) continue; //skip trade

      console.log(chalk.whiteBright(
        `[${chalk.yellowBright(secondExchange.name)}] ${chalk.yellowBright(secondTradeSymbol)}  | Best Ask: ${chalk.yellowBright(secondOrderbook.asks[0][0])} (qty: ${chalk.yellowBright(secondOrderbook.asks[0][1])}) | ` +
          `Best Bid: ${chalk.yellowBright(secondOrderbook.bids[0][0])} (qty: ${chalk.yellowBright(secondOrderbook.bids[0][1])})`
      ));

      //Orderbook 3
      console.log(chalk.whiteBright(
        `Getting order books for: ${thirdTradeSymbol} on ${thirdExchange.name}`
      ));

      const thirdOrderbook: Orderbook = await thirdExchange.getOrderbook(
        "ETHUSDT"
      );


      if(await this.isOrderbookEmpty(thirdOrderbook)) continue; //skip trade

      console.log(chalk.whiteBright(
        `[${chalk.yellowBright(thirdExchange.name)}] ${chalk.yellowBright(thirdTradeSymbol)} | Best Ask: ${chalk.yellowBright(thirdOrderbook.asks[0][0])} (qty: ${chalk.yellowBright(thirdOrderbook.asks[0][1])}) | ` +
          `Best Bid: ${chalk.yellowBright(thirdOrderbook.bids[0][0])} (qty: ${chalk.yellowBright(thirdOrderbook.bids[0][1])})`
      ));

      // Step 2: Start with USDT
      let capital = 5; // Load from config later
      console.log(`\n💰 Starting Capital: ${capital} USDT`);

      // Trade 1:
      const firstTrade = capital / firstOrderbook.asks[0][0];
      console.log(chalk.whiteBright(`\n--- Trade 1️⃣ ${chalk.yellowBright(firstTradeSymbol)} ---`));
      console.log(chalk.whiteBright(`Ask Price (${chalk.yellowBright(firstTradeSymbol)}): ${chalk.yellowBright(firstOrderbook.asks[0][0])}`));
      console.log(chalk.whiteBright(`${chalk.yellowBright(firstTradeSymbol.slice(0,3))} Bought: ${chalk.yellowBright(firstTrade.toFixed(6))}\n`));
      const firstTradeFee = await firstExchange.getFees();
      const firstTradeMakerFee = firstTradeFee.maker * firstTrade;
      const firstTradeAfterFee = firstTrade - firstTradeMakerFee;
      console.log(chalk.whiteBright(`Final ${firstTradeSymbol.slice(0,3)} bought after fee: ${firstTradeAfterFee}\n`));

      // Trade 2: 
      const secondTrade = firstTradeAfterFee * secondOrderbook.asks[0][0];
      console.log(chalk.whiteBright(`--- Trade 2️⃣ ${chalk.yellowBright(secondTradeSymbol.slice(0,3))} → ${chalk.yellowBright(secondTradeSymbol.slice(3,6))} ---`));
      console.log(chalk.whiteBright(`Ask Price ${chalk.yellowBright(secondTradeSymbol)}: ${chalk.yellowBright(secondOrderbook.asks[0][0])}`));
      console.log(chalk.whiteBright(`${chalk.yellowBright(secondTradeSymbol.slice(3,6))} Bought: ${chalk.yellowBright(secondTrade.toFixed(6))}\n`));
      const secondTradeFee = await secondExchange.getFees();
      const secondTradeMakerFee = secondTradeFee.maker * firstTrade;
      const tradeAfterFee_02 = secondTrade - secondTradeMakerFee;
      console.log(chalk.whiteBright(`Final ${chalk.yellowBright(secondTradeSymbol.slice(3,6))} bought after fee: ${chalk.yellowBright(tradeAfterFee_02)}\n`));

      // Trade 3:
      const thirdTrade = tradeAfterFee_02 * thirdOrderbook.bids[0][0];
      console.log(chalk.whiteBright(`--- Trade 3️⃣ ${chalk.yellowBright(thirdTradeSymbol.slice(0,3))} → USDT ---`));
      console.log(chalk.whiteBright(`Bid Price ${chalk.yellowBright(thirdTradeSymbol)}: ${chalk.yellowBright(thirdOrderbook.bids[0][0])}`));
      console.log(chalk.whiteBright(`Final USDT: ${chalk.yellowBright(thirdTrade.toFixed(8))}\n`));
      const thirdTradeFee = await thirdExchange.getFees();
      const thirdTradeTakerFee = thirdTradeFee.taker * thirdTrade;
      const tradeAfterFee_03 = thirdTrade - thirdTradeTakerFee;
      console.log(chalk.whiteBright(`Final ${chalk.yellowBright(thirdTradeSymbol.slice(3,6))} bought after fee: ${chalk.yellowBright(tradeAfterFee_03)}\n`));
      const finalUsdt = tradeAfterFee_03;



      // Step 3: Profit Calculation
      const profit = finalUsdt - capital;
      console.log(chalk.whiteBright(`📊 Profit/Loss Calculation`));
      console.log(chalk.whiteBright(
        `Start: ${capital} USDT | Final: ${finalUsdt.toFixed(
          8
        )} USDT | Profit: ${profit.toFixed(8)} USDT\n`
      ));

      if (profit > 0) {
        console.log(chalk.greenBright.bold(`✅ PROFIT OPPORTUNITY! +${profit.toFixed(8)} USDT`));
      } else {
        console.log(chalk.redBright(
          `❌ No profit opportunity detected. Profit: ${profit.toFixed(8)} USDT`
        ));
      }
      console.log(`\n==========================================================================\n`);
    }
  }
}
