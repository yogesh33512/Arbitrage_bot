import { orderbookSide } from "./ordrbooks.types";

class Orderbooks {
  constructor() {
    console.log("[Orderbooks] Initialized Orderbooks instance");
  }

  async avgPriceFromBook(bookSide: orderbookSide, size: number) {
    console.log(`[avgPriceFromBook] Calculating avg price for size: ${size}`);
    let remaining = size; // how much of the order is still left to fill
    let cost = 0; // total cost (price*amount) so far
    let consumed = 0; // how much of the requested size is filled so far

    for (const [price, levelSize] of bookSide) {
      if (remaining <= 0) {
        console.log("[avgPriceFromBook] Order fully consumed, stopping iteration");
        break;
      }

      const take = Math.min(levelSize, remaining); // how much we can take from this level
      cost += take * price; // add cost of this portion
      consumed += take; // add to filled amount
      remaining -= take; // reduce remaining amount to fill

      console.log(
        `[avgPriceFromBook] Taking ${take} @ ${price}, total consumed: ${consumed}, remaining: ${remaining}`
      );
    }

    if (consumed < size) {
      console.warn(
        `[avgPriceFromBook] ⚠ Insufficient liquidity. Requested: ${size}, Filled: ${consumed}`
      );
      return { avgPrice: Number.POSITIVE_INFINITY, consumed }; // insufficient liquidity
    }

    const avgPrice = cost / size;
    console.log(`[avgPriceFromBook] ✅ Avg price calculated: ${avgPrice}, Total consumed: ${consumed}`);
    return { avgPrice, consumed };
  }

  async calculateProfit(
    buyPrice: number, // avg price to pay per unit to buy
    sellPrice: number, // avg price to pay per unit to sell
    size: number, // how many unit you are trading
    buyFee: number, // fraction fee on buy
    sellFee: number // fraction fee on sell
  ) {
    console.log(
      `[calculateProfit] Calculating profit | Buy: ${buyPrice}, Sell: ${sellPrice}, Size: ${size}, BuyFee: ${buyFee}, SellFee: ${sellFee}`
    );

    const cost = buyPrice * size;
    const costWithFee = cost + cost * buyFee;
    const proceeds = sellPrice * size;
    const proceedsAfterFee = proceeds - proceeds * sellFee;
    const netProfit = proceedsAfterFee - costWithFee;
    const roi = netProfit / costWithFee;

    console.log(
      `[calculateProfit] ✅ NetProfit: ${netProfit}, ROI: ${(roi * 100).toFixed(
        2
      )}%, CostWithFee: ${costWithFee}, ProceedsAfterFee: ${proceedsAfterFee}`
    );

    return { netProfit, roi, cost: costWithFee, proceeds: proceedsAfterFee };
  }
}

export const orderBooks = new Orderbooks();
