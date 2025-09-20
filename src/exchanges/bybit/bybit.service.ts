import { RestClientV5 } from "bybit-api";
import WebSocket from "ws";
import dotenv from "dotenv";
dotenv.config();

const { BYBIT_WS_URL, BYBIT_API_KEY_TESTNET, BYBIT_API_SECRET_TESTNET } =
  process.env;


export class BYbitService {
  private apiKey: string;
  private secret: string;
  private client: RestClientV5;
  private ws: WebSocket | null = null;

  constructor() {
    this.apiKey = process.env.BYBIT_API_KEY as string;
    this.secret = process.env.BYBIT_SECRET as string;
    this.client = new RestClientV5({
      testnet: true,
      key: this.apiKey,
      secret: this.secret,
    });
  }

  async marketBuy(symbol: string, quantity: string) {
    try {
    const response = await this.client.submitOrder({
      category: "spot",
      symbol,
      side: "Buy",
      orderType: "Market",
      qty:quantity,
    });
    return response; 
  } catch (error) {
    console.error("Market Buy Error:", error);
    throw error;
    }
  }

  async marketSell(symbol: string, quantity: string) {
    try {
        const response = await this.client.submitOrder({
      category: "spot",
      symbol: symbol,
      side: 'Sell',
      orderType: "Market",
      qty: quantity,
    })
    return response;        
    } catch (error) {
    console.error("Market Buy Error:", error);
    throw error;    
    }

  }

  connectTicker() {
    this.ws = new WebSocket(BYBIT_WS_URL!);

    this.ws.on("open", () => {
      console.log(`✅ Connected to bybit Testnet:}`);

      this.ws?.send(
        JSON.stringify({
          op: "subscribe",
          args: ["tickers.ETHUSDT", "tickers.BTCUSDT", "tickers.SOLUSDT"],
          req_id: "price_sub",
        })
      );
    });

    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      // console.log(msg)
      if (msg.topic?.startsWith("tickers")) {
        const symbol = msg.data.symbol; // e.g., ETHUSDT
        const price = parseFloat(msg.data.lastPrice); // last price

        console.log(`Price on Bybit ${symbol}: ${price}`);
      }
    });

    // Heartbeat every 20s
    setInterval(() => {
      this.ws?.send(JSON.stringify({ op: "ping", req_id: "ping1" }));
    }, 20000);

    this.ws.on("close", () => {
      console.log("Connection closed. Reconnecting...");
      setTimeout(() => {
        this.ws = new WebSocket(BYBIT_WS_URL!);
      }, 1000);
    });

    this.ws.on("error", (err) => {
      console.error("WebSocket Error:", err);
    });
  }

  disconnect() {
    this.ws?.close();
  }
}
