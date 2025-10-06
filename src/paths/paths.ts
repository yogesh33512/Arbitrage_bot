import { exchangeSymbols } from "./symbols";

export const basePaths = [
  ["SOLUSDT", "SOLBTC", "BTCUSDT"],
  ["SOLUSDT", "SOLETH", "ETHUSDT"],
  ["BTCUSDT", "BTCSOL", "SOLUSDT"],
  ["BTCUSDT", "BTCETH", "ETHUSDT"],
  ["ETHUSDT", "ETHSOL", "SOLUSDT"],
  ["ETHUSDT", "ETHBTC", "BTCUSDT"],
];

const exchanges = ["Binance", "MEXC", "BingX", "Bybit"];

export async function generateCrossExchangePaths(
  exchangeSymbols: Record<string, string[]>,
  basePaths: string[][]
): Promise<{ exchange: string; symbol: string; direction: string }[][]> {
  const result: { exchange: string; symbol: string; direction: string }[][] =
    [];
  for (const path of basePaths) {
    for (const ex1 of exchanges) {
      for (const ex2 of exchanges) {
        for (const ex3 of exchanges) {
          if (
            exchangeSymbols[ex1].includes(path[0]) &&
            exchangeSymbols[ex2].includes(path[1]) &&
            exchangeSymbols[ex3].includes(path[2])
          ) {
            result.push([
              { exchange: ex1, symbol: path[0], direction: "BUY" },
              { exchange: ex2, symbol: path[1], direction: "SELL" },
              { exchange: ex3, symbol: path[2], direction: "SELL" },
            ]);
          }
        }
      }
    }
  }
  return result;
}
