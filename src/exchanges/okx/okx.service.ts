import WebSocket from "ws";
import { RestClient } from 'okx-api';
import dotenv from "dotenv";
dotenv.config();

interface SubscribeMsg {
  op: string;
  args: { channel: string; instId: string }[];
}

export class OKXService {
  private socket!: WebSocket;
  private readonly url = "wss://wspap.okx.com:8443/ws/v5/public?brokerId=9999";
  private readonly symbols = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];
  private client:RestClient

  constructor() {
    this.init();
    this.client = new RestClient({
      apiKey:process.env.OKX_API_KEY,
      apiSecret:process.env.OKX_SECRET,
      apiPass:''
    })
  }


  async marketBuy(instId:string, quantity:string){  //instId = 'BTC-USDT'
    try {
      const response = await this.client.submitOrder({
        instId:instId,
        tdMode:'cash',        //cash is for spot trade
        clOrdId:'b12',        //order id, we can also define it to track on our own
        side:'buy',     
        ordType:'market',
        sz:quantity           // quantity to buy or sell    
      })
      return response; 
    } catch (error) {
      console.error("OKX Market Buy Error:", error);
      throw error;
    }
  }


    async marketSell(instId:string, quantity:string){  
    try {
      const response = await this.client.submitOrder({
        instId:instId,
        tdMode:'cash',  
        clOrdId:'b12',  
        side:'sell',     
        ordType:'market',
        sz:quantity               
      })
      return response; 
    } catch (error) {
      console.error("OKX Market Sell Error:", error);
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
    console.log("✅ OKX Demo WebSocket connected");

    const subscribeMsg: SubscribeMsg = {
      op: "subscribe",
      args: this.symbols.map((sym) => ({
        channel: "tickers",
        instId: sym,
      })),  
    };

    this.socket.send(JSON.stringify(subscribeMsg));
  }

  private onMessage(message: any): void {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.arg && msg.data) {
        msg.data.forEach((ticker: any) => {
          console.log(`📈 ${ticker.instId} last price: ${ticker.last}`);
        });
      } else if (msg.event) {
        console.log("⚡ Event:", msg.event, msg.arg || "");
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
