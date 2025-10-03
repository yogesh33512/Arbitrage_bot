import { ExchangeAdapter } from "./arbitrage.types";
import { Orderbook } from "../orderBooks/ordrbooks.types";

export class TriangularArbitrage {
  constructor() {}

  async findOpportunity(exchange: ExchangeAdapter) {
    console.log(`\n==============================`);
    console.log(`🔍 Checking triangular arbitrage on: ${exchange.name}`);
    console.log(`==============================\n`);

    //USDT ->  SOL -> ETH -> USDT

    // Step 1: Fetch orderbooks
    console.log("📥 Fetching orderbooks...");
    const orderbook_usdt_sol: Orderbook = await exchange.getOrderbook("SOLUSDT");
    console.log(
      `SOLUSDT | Best Ask: ${orderbook_usdt_sol.asks[0][0]} (qty: ${orderbook_usdt_sol.asks[0][1]}) | ` +
      `Best Bid: ${orderbook_usdt_sol.bids[0][0]} (qty: ${orderbook_usdt_sol.bids[0][1]})`
    );

    const orderbook_sol_eth: Orderbook = await exchange.getOrderbook("SOLETH");
    console.log(
      `SOLETH  | Best Ask: ${orderbook_sol_eth.asks[0][0]} (qty: ${orderbook_sol_eth.asks[0][1]}) | ` +
      `Best Bid: ${orderbook_sol_eth.bids[0][0]} (qty: ${orderbook_sol_eth.bids[0][1]})`
    );

    const orderbook_eth_usdt: Orderbook = await exchange.getOrderbook("ETHUSDT");
    console.log(
      `ETHUSDT | Best Ask: ${orderbook_eth_usdt.asks[0][0]} (qty: ${orderbook_eth_usdt.asks[0][1]}) | ` +
      `Best Bid: ${orderbook_eth_usdt.bids[0][0]} (qty: ${orderbook_eth_usdt.bids[0][1]})`
    );

    // Step 2: Start with USDT
    let capital = 5; // Load from config later
    console.log(`\n💰 Starting Capital: ${capital} USDT`);

    // Trade 1: USDT -> SOL
    const solBought = capital / orderbook_usdt_sol.asks[0][0];
    console.log(`\n--- Trade 1️⃣ USDT → SOL ---`);
    console.log(`Ask Price (USDT/SOL): ${orderbook_usdt_sol.asks[0][0]}`);
    console.log(`SOL Bought: ${solBought.toFixed(6)}\n`);

    // Trade 2: SOL -> ETH
    const ethBought = solBought * orderbook_sol_eth.asks[0][0];
    console.log(`--- Trade 2️⃣ SOL → ETH ---`);
    console.log(`Ask Price (ETH/SOL): ${orderbook_sol_eth.asks[0][0]}`);
    console.log(`ETH Bought: ${ethBought.toFixed(6)}\n`);

    // Trade 3: ETH -> USDT
    const finalUsdt = ethBought * orderbook_eth_usdt.bids[0][0];
    console.log(`--- Trade 3️⃣ ETH → USDT ---`);
    console.log(`Bid Price (USDT/ETH): ${orderbook_eth_usdt.bids[0][0]}`);
    console.log(`Final USDT: ${finalUsdt.toFixed(2)}\n`);

    // Step 3: Profit Calculation
    const profit = finalUsdt - capital;
    console.log(`📊 Profit/Loss Calculation`);
    console.log(`Start: ${capital} USDT | Final: ${finalUsdt.toFixed(2)} USDT | Profit: ${profit.toFixed(2)} USDT\n`);

    if (profit > 0) {
      console.log(`✅ PROFIT OPPORTUNITY! +${profit.toFixed(2)} USDT`);
    } else {
      console.log(`❌ No profit opportunity detected. Profit: ${profit.toFixed(2)} USDT`);
    }

    console.log(`\n==============================\n`);
  }
}
