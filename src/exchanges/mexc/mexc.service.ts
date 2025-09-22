import WebSocket from "ws";
import { Spot } from 'mexc-api-sdk';


export class MEXCServices {
  private socket!: WebSocket;
  private readonly url = "wss://wbs.mexc.com/ws"; // Spot Market WS
  private readonly symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  private client: Spot;
  private apiKey: string;
  private apiSecret: string


  constructor() {
    this.init();
    this.apiKey = process.env.MEXC_API_KEY!,
      this.apiSecret = process.env.MEXC_API_SECRET!,
      this.client = new Spot(
        this.apiKey,
        this.apiSecret
      )
  }


  async marketBuy(symbol: string, quantity: string) {
    try {
      const response = await this.client.newOrder(
        symbol,
        'BUY',
        'MARKET',
        quantitya
      ) 
      return response;
    } catch (error) {
      console.error("MEXC Market Buy Error:", error);
      throw error;
    }

  }

  async marketSell(symbol: string, quantity: string) {
    try {
      const response = await this.client.newOrder(
        symbol,
        'SELL',
        'MARKET',
        quantity)
    } catch (error) {
      console.error("MEXC Market Sell Error:", error);
      throw error;
    }
  }


  /** ============ WEBSOCKET METHODS ============ **/


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
        params: [`spot@public.deals.v3.api@${sym}`],
      };
      this.socket.send(JSON.stringify(subscribeMsg));
      console.log(`📡 Subscribed to ${sym}`);
    });
  }

  private onMessage(message: any): void {
    try {
      const msg = JSON.parse(message.toString());

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
const mexcClient = new MEXCServices();
