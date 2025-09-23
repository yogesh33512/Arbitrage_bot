import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import WebSocket from "ws";
import { exchangeQuoteSymbol } from "./binance.types";

const { BINANCE_API_KEY, BINANCE_API_SECRET, BINANCE_BASE_URL, BINANCE_WS_URL } = process.env;

export class BinanceService {
  private apiKey: string;
  private secret: string;
  private http: AxiosInstance;
  private ws: WebSocket | null = null;

  constructor() {
    this.apiKey = BINANCE_API_KEY!;
    this.secret = BINANCE_API_SECRET!;
    this.http = axios.create({
      baseURL: BINANCE_BASE_URL || "https://testnet.binance.vision", // Spot testnet
      headers: { "X-MBX-APIKEY": this.apiKey },
      timeout: 10000,
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
    return this.placeOrder({
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity: quantity.toString(),
    });
  }

  async marketSell(symbol: string, quantity: number) {
    return this.placeOrder({
      symbol,
      side: "SELL",
      type: "MARKET",
      quantity: quantity.toString(),
    });
  }


  async exchangeQuote(symbol:exchangeQuoteSymbol){
    console.log('BINANCE URL -> ',BINANCE_BASE_URL);
    try {
      const url = `${BINANCE_BASE_URL}/api/v3/ticker/price`;
      const response = await axios.get(url,{
        params:{
          symbol:symbol
        }
      })
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  
  /** ============ WEBSOCKET METHODS ============ **/
  connectTicker(symbols: string[] = ["btcusdt", "ethusdt"]) {
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
};