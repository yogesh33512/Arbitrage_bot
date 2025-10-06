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

  async findOpportunity() {
    this.feasibleTradingPaths = await generateCrossExchangePaths(
      exchangeSymbols,
      basePaths
    );
    // console.log(this.feasibleTradingPaths);
    for (let i = 0; i < this.feasibleTradingPaths.length; i++) {
      console.log(`\n==============================`);

      //Getting trade exchanges
      const exchange_01_name = this.feasibleTradingPaths[i][0].exchange;
      const exchange_02_name = this.feasibleTradingPaths[i][1].exchange;
      const exchange_03_name = this.feasibleTradingPaths[i][2].exchange;

      const exchange_01 = this.allExchanges[exchange_01_name];
      const exchange_02 = this.allExchanges[exchange_02_name];
      const exchange_03 = this.allExchanges[exchange_03_name];

      console.log(
        "Exchanges-------->",
        exchange_01.name,
        exchange_02.name,
        exchange_03.name
      );

      //getting trade symbols

      const trade_symbol_01 = this.feasibleTradingPaths[i][0].symbol;
      const trade_symbol_02 = this.feasibleTradingPaths[i][1].symbol;
      const trade_symbol_03 = this.feasibleTradingPaths[i][2].symbol;
      console.log(
        "trade symbols---------------->",
        trade_symbol_01,
        trade_symbol_02,
        trade_symbol_03
      );

      console.log(
        `🔍 Checking triangular arbitrage on: ${exchange_01}, ${exchange_02}, ${exchange_03}`
      );
      console.log(
        `=============Finding Opportunity ${i + 1} =================\n`
      );

      // Step 1: Fetch orderbooks
      console.log("📥 Fetching orderbooks...");

      //Orderbook 1
      console.log(
        `Getting order books for: ${trade_symbol_01} on ${exchange_01.name}`
      );
      const orderbook_trade_01: Orderbook = await exchange_01.getOrderbook(
        trade_symbol_01
      );
      if (
        orderbook_trade_01.asks.length === 0 ||
        orderbook_trade_01.bids.length === 0
      ) {
        continue;
      }
      console.log(
        `[${exchange_01.name}] ${trade_symbol_01} | Best Ask: ${orderbook_trade_01.asks[0][0]} (qty: ${orderbook_trade_01.asks[0][1]}) | ` +
          `Best Bid: ${orderbook_trade_01.bids[0][0]} (qty: ${orderbook_trade_01.bids[0][1]})`
      );

      //Orderbook 2

      console.log(
        `Getting order books for: ${trade_symbol_02} on ${exchange_02.name}`
      );

      const orderbook_trade_02: Orderbook = await exchange_02.getOrderbook(
        trade_symbol_02
      );
      if (
        orderbook_trade_02.asks.length === 0 ||
        orderbook_trade_02.bids.length === 0
      ) {
        continue;
      }
      console.log(
        `[${exchange_02.name}] ${trade_symbol_02}  | Best Ask: ${orderbook_trade_02.asks[0][0]} (qty: ${orderbook_trade_02.asks[0][1]}) | ` +
          `Best Bid: ${orderbook_trade_02.bids[0][0]} (qty: ${orderbook_trade_02.bids[0][1]})`
      );

      //Orderbook 3
      console.log(
        `Getting order books for: ${trade_symbol_03} on ${exchange_03.name}`
      );

      const orderbook_trade_03: Orderbook = await exchange_03.getOrderbook(
        "ETHUSDT"
      );

      if (
        orderbook_trade_03.asks.length === 0 ||
        orderbook_trade_03.bids.length === 0
      ) {
        continue;
      }
      console.log(
        `[${exchange_03.name}] ${trade_symbol_03} | Best Ask: ${orderbook_trade_03.asks[0][0]} (qty: ${orderbook_trade_03.asks[0][1]}) | ` +
          `Best Bid: ${orderbook_trade_03.bids[0][0]} (qty: ${orderbook_trade_03.bids[0][1]})`
      );

      // Step 2: Start with USDT
      let capital = 5; // Load from config later
      console.log(`\n💰 Starting Capital: ${capital} USDT`);

      // Trade 1: USDT -> SOL
      const solBought = capital / orderbook_trade_01.asks[0][0];
      console.log(`\n--- Trade 1️⃣ USDT → SOL ---`);
      console.log(`Ask Price (USDT/SOL): ${orderbook_trade_01.asks[0][0]}`);
      console.log(`SOL Bought: ${solBought.toFixed(6)}\n`);

      // Trade 2: SOL -> ETH
      const ethBought = solBought * orderbook_trade_02.asks[0][0];
      console.log(`--- Trade 2️⃣ SOL → ETH ---`);
      console.log(`Ask Price (ETH/SOL): ${orderbook_trade_02.asks[0][0]}`);
      console.log(`ETH Bought: ${ethBought.toFixed(6)}\n`);

      // Trade 3: ETH -> USDT
      const finalUsdt = ethBought * orderbook_trade_03.bids[0][0];
      console.log(`--- Trade 3️⃣ ETH → USDT ---`);
      console.log(`Bid Price (USDT/ETH): ${orderbook_trade_03.bids[0][0]}`);
      console.log(`Final USDT: ${finalUsdt.toFixed(2)}\n`);

      // Step 3: Profit Calculation
      const profit = finalUsdt - capital;
      console.log(`📊 Profit/Loss Calculation`);
      console.log(
        `Start: ${capital} USDT | Final: ${finalUsdt.toFixed(
          8
        )} USDT | Profit: ${profit.toFixed(8)} USDT\n`
      );

      if (profit > 0) {
        console.log(`✅ PROFIT OPPORTUNITY! +${profit.toFixed(8)} USDT`);
      } else {
        console.log(
          `❌ No profit opportunity detected. Profit: ${profit.toFixed(8)} USDT`
        );
      }
      console.log(`\n==============================\n`);
    }
  }
}
