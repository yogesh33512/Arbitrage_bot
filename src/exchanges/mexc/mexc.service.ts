import WebSocket from "ws";
import { Spot } from "mexc-api-sdk";
import { exchangeQuoteSymbol } from "./mexc.types";
import crypto from "crypto";
import axios from "axios";
import { Orderbook } from "../binance/binance.types";

class MEXCServices {
  private socket!: WebSocket;
  private readonly url = " wss://wbs-api.mexc.com/ws"; // Spot Market WS
  private readonly symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  private client: Spot;
  private apiKey: string;
  private apiSecret: string;
  private wsDS: WebSocket | null = null;
  private orderbooks: Record<string, Orderbook> = {};

  constructor() {
    //this.init();
    (this.apiKey = process.env.MEXC_API_KEY as string),
      (this.apiSecret = process.env.MEXC_SECRET as string),
      (this.client = new Spot(this.apiKey, this.apiSecret));
    //this.connectUserDataStream();
  }

  async marketBuy(
    symbol: exchangeQuoteSymbol,
    quantity?: string,
    quoteOrderQty?: string
  ) {
    try {
      const options: any = {};

      if (quantity) {
        options.quantity = quantity;
      } else if (quoteOrderQty) {
        options.quoteOrderQty = quoteOrderQty;
      } else {
        throw new Error("You must provide either quantity or quoteOrderQty");
      }
      const response = await this.client.newOrder(
        symbol,
        "BUY",
        "MARKET",
        options
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async marketSell(
    symbol: exchangeQuoteSymbol,
    quantity?: string,
    quoteOrderQty?: string
  ) {
    try {
      const options: any = {};

      if (quantity) {
        options.quantity = quantity;
      } else if (quoteOrderQty) {
        options.quoteOrderQty = quoteOrderQty;
      } else {
        throw new Error("You must provide either quantity or quoteOrderQty");
      }

      const response = await this.client.newOrder(
        symbol,
        "SELL",
        "MARKET",
        options
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async checkBalance() {
    try {
      const response = await this.client.accountInfo();
      return response;
    } catch (error) {
      console.error("MEXC Balance Error:", error);
      throw error;
    }
  }

  async exchangeQuote(symbol: exchangeQuoteSymbol) {
    const tickers = await this.client.tickerPrice(symbol);
    return tickers;
  }

  async getOrderBooks(symbol: string, limit = 5) {
    try {
      const res = await this.client.depth(symbol, limit);
      const orderbook: Orderbook = {
        bids: res.bids.map(([price, qty]: [string, string]) =>
          [Number(price), Number(qty)].slice(0, 5)
        ),
        asks: res.asks.map(([price, qty]: [string, string]) =>
          [Number(price), Number(qty)].slice(0, 5)
        ),
      };
      this.orderbooks[symbol.toLowerCase()] = orderbook;
      return orderbook;
    } catch (error) {
      console.log(`Error occured while fetching mexc order books: `, error);
      return { bids: [], asks: [] };
    }
  }

  /** ============ WEBSOCKET METHODS ============ **/

  async connectUserDataStream() {
    try {
      const listenKey =
        "430229392a0d0a278899c06117d939befaf3722b93cef0fa5f1dc94160eea1ac";

      this.wsDS = new WebSocket(`wss://wbs.mexc.com/ws?listenKey=${listenKey}`);
      this.wsDS.on("open", () => console.log("✅ User WS connected"));

      this.wsDS.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log("📩 User event:", data); // executions, balances, etc.
        } catch (err) {
          console.error("Parse error:", err, msg.toString());
        }
      });
    } catch (err) {
      console.error("❌ Failed to connect user WS:", err);
    }
  }

  private async sign(params: any) {
    const query = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");

    return crypto.createHmac("sha256", this.apiKey).update(query).digest("hex");
  }

  private async createListenKey() {
    try {
      let params: any = { timestamp: Date.now() };
      const signature = this.sign(params);
      params.signature = signature;

      const query = new URLSearchParams(params).toString();

      const res = await axios.post(
        `https://api.mexc.com/api/v3/userDataStream?${query}`,
        {}, // empty body
        {
          headers: { "X-MEXC-APIKEY": this.apiKey },
        }
      );

      console.log("ListenKey response:", res.data);
      return res.data.listenKey;
    } catch (err: any) {
      console.error("Error:", err.response?.data || err.message);
    }
  }

  public connectTicker(): void {
    this.init();
  }

  private init(): void {
    this.socket = new WebSocket(this.url);

    this.socket.on("open", () => this.onOpen());
    this.socket.on("message", (msg) => this.onMessage(msg));
    this.socket.on("error", (err) => this.onError(err));
    this.socket.on("close", () => this.onClose());
  }

  private onOpen(): void {
    console.log("✅ MEXC WebSocket connected");

    // Subscribe one-by-one
    this.symbols.forEach((sym) => {
      const subscribeMsg = {
        method: "SUBSCRIPTION",
        //params: [`spot@public.deals.v3.api@${sym}`],
        params: [`spot@public.bookTicker.v3.api@${sym}`],
        id: 1,
      };
      this.socket.send(JSON.stringify(subscribeMsg));
      console.log(`📡 Subscribed to ${sym}`);
    });
  }

  private onMessage(message: any): void {
    try {
      const msg = JSON.parse(message.toString());
      console.log("msg mexc--------------->", msg);
      if (msg?.d && msg?.s) {
        // d = trades array, s = symbol
        const trades = msg.d;
        if (trades.length > 0) {
          const lastTrade = trades[trades.length - 1];
          console.log(`📈 ${msg.s} last price: ${lastTrade.p}`);
        }
      } else if (msg.code || msg.msg) {
        console.log("⚡ Server response:", msg);
      }
    } catch (err) {
      console.error("⚠️ Error parsing message:", err);
    }
  }

  private onError(error: Error): void {
    console.error("❌ WebSocket error:", error.message);
  }

  private onClose(): void {
    console.log("🔌 WebSocket connection closed");
  }
}

// Run client
export const mexcService = new MEXCServices();
