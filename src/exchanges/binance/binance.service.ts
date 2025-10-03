import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import WebSocket from "ws";
import { exchangeQuoteSymbol, Orderbook } from "./binance.types";
import {
  Spot,
  SpotRestAPI,
  SPOT_REST_API_TESTNET_URL,
} from "@binance/spot";

const {
  BINANCE_API_KEY,
  BINANCE_API_SECRET,
  BINANCE_BASE_URL,
  BINANCE_WS_URL,
} = process.env;

class BinanceService {
  private apiKey: string;
  private secret: string;
  private http: AxiosInstance;
  private ws: WebSocket | null = null;
  private client: Spot;
  private orderbooks: Record<string, Orderbook> = {};

  constructor() {
    this.apiKey = BINANCE_API_KEY!;
    this.secret = BINANCE_API_SECRET!;
    this.http = axios.create({
      baseURL: BINANCE_BASE_URL || "https://testnet.binance.vision", // Spot testnet
      headers: { "X-MBX-APIKEY": this.apiKey },
      timeout: 10000,
    });
    this.ws = new WebSocket("wss://ws-api.testnet.binance.vision/ws-api/v3", {
      headers: {
        "X-MBX-APIKEY": this.apiKey,
      },
    });

    this.client = new Spot({
      configurationRestAPI: {
        apiKey:
          "vg22knWAzNsS4NbOobpvsImhAlkFIb1a7uvSiUnELXNFTjx9rm9484hCgvHzcXsv",
        privateKey: "./binance-spot-ed25519.pem",
        basePath: SPOT_REST_API_TESTNET_URL,
      },
    });

  }

  /** ============ REST ORDER METHODS ============ **/
  private sign(query: string) {
    return crypto.createHmac("sha256", this.secret).update(query).digest("hex");
  }

  private buildQuery(params: Record<string, any>) {
    params.timestamp = Date.now();
    const kv = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join("&");
    const signature = this.sign(kv);
    return `${kv}&signature=${signature}`;
  }

  private async placeOrder(params: Record<string, any>) {
    const qs = this.buildQuery(params);
    const url = `/api/v3/order?${qs}`;
    const res = await this.http.post(url);
    return res.data;
  }

  async marketBuy(symbol: string, quantity: number) {
    /* return this.placeOrder({
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity: quantity.toString(),
    });*/
    try {
      const response = this.client.restAPI.newOrder({
        symbol: symbol,
        side: SpotRestAPI.NewOrderSideEnum.BUY,
        type: SpotRestAPI.NewOrderTypeEnum.MARKET,
        timeInForce: SpotRestAPI.NewOrderTimeInForceEnum.GTC,
        quantity: quantity,
      });
      const data = (await response).data();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async marketSell(symbol: string, quantity: number) {
    return this.placeOrder({
      symbol,
      side: "SELL",
      type: "MARKET",
      quantity: quantity.toString(),
    });
  }

  async exchangeQuote(symbol: exchangeQuoteSymbol) {
    try {
      const url = `${BINANCE_BASE_URL}/api/v3/ticker/price`;
      const response = await axios.get(url, {
        params: {
          symbol: symbol,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit = 5) {
    try {
      const url = `${BINANCE_BASE_URL}/api/v3/depth?symbol=${symbol}&limit=${limit}`;
      const res = await axios.get(url);

      const orderbook: Orderbook = {
        bids: res.data.bids.map(([price, qty]: [string, string]) => [
          Number(price),
          Number(qty),
        ]),
        asks: res.data.asks.map(([price, qty]: [string, string]) => [
          Number(price),
          Number(qty),
        ]),
      };
      this.orderbooks[symbol.toLowerCase()] = orderbook;
      console.log(`orderbook------------->${symbol}`,orderbook);
      return orderbook;
    } catch (err) {
      console.error("Error fetching orderbook:", err);
      return { bids: [], asks: [] };
    }
  }

  /** ============ WEBSOCKET METHODS ============ **/
  connectTicker(symbols: string[] = ["btcusdt", "ethusdt", "solusdt"]) {
    const streams = symbols.map((s) => `${s}@ticker`).join("/");
    this.ws = new WebSocket(`${BINANCE_WS_URL}/${streams}`);

    this.ws.on("open", () => {
      console.log("✅ Connected to Binance WS");
    });

    this.ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      const stream = msg.stream; // e.g., btcusdt@ticker
      const price = msg.data.c; // last price
      console.log(`📊 ${stream}: ${price}`);
      console.log("msg----->", msg);
    });

    this.ws.on("error", (err) => {
      console.error("❌ Binance WS Error:", err);
    });

    this.ws.on("close", () => {
      console.log("🔌 Binance WS Connection Closed");
    });
  }

  disconnect() {
    this.ws?.close();
  }

  async userDataStream() {}
}

export const binanceService = new BinanceService();
