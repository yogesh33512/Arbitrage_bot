import WebSocket from "ws";
import { RestClient } from "okx-api";
import axios from "axios";
import CryptoJS from "crypto-js";

interface SubscribeMsg {
  op: string;
  args: { channel: string; instId: string }[];
}

export class OKXService {
  private socket!: WebSocket;
  private readonly url = "wss://wspap.okx.com:8443/ws/v5/public?brokerId=9999";
  private readonly symbols = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];
  private client: RestClient;
  private BASE_URL_OKX: string;
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;

  constructor() {
    this.init();
    this.BASE_URL_OKX = process.env.BASE_URL_OKX as string;
    this.apiKey = process.env.OKX_API_KEY as string;
    this.secretKey = process.env.OKX_SECRET as string;
    this.passphrase = process.env.OKX_PASSPHRASE as string;

    this.client = new RestClient({
      apiKey: process.env.OKX_API_KEY,
      apiSecret: process.env.OKX_SECRET,
      apiPass: process.env.OKX_PASSPHRASE,
    });
  }

  getSignature(
    timestamp: string,
    method: string,
    requestPath: string,
    body: object | null,
    secretKey: string
  ) {
    const bodyString = body ? JSON.stringify(body) : "";
    const prehash = timestamp + method.toUpperCase() + requestPath + bodyString;
    const hash = CryptoJS.HmacSHA256(prehash, secretKey);
    return CryptoJS.enc.Base64.stringify(hash);
  }

  async marketBuy(instId: string, quantity: string) {
    //instId = 'BTC-USDT'
    try {
      // const response = await this.client.submitOrder({
      //   instId:instId,
      //   tdMode:'cash',        //cash is for spot trade
      //   clOrdId:'b12',        //order id, we can also define it to track on our own
      //   side:'buy',
      //   ordType:'market',
      //   sz:quantity,           // quantity to buy or sell
      // })
      // return response;

      const method = "POST";
      const body = {
        instId,
        tdMode: "cash",
        clOrdId: "b15-" + Date.now(),
        side: "buy",
        ordType: "market",
        sz: quantity,
      };

      const timestamp = (Date.now() / 1000).toString();
      const requestPath = `/api/v5/trade/order`;

      const signature = this.getSignature(
        timestamp,
        method,
        requestPath,
        body,
        this.secretKey
      );

      const headers = {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": this.apiKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": this.passphrase,
      };

      // console.log("Headers:", headers);
      // console.log("Body:", body);
      // console.log("URL:", `${this.BASE_URL_OKX}${requestPath}`);

      const response = await axios.post(
        `${this.BASE_URL_OKX}${requestPath}`,
        body,
        { headers: headers }
      );
      return response.data;
    } catch (error) {
      console.error("OKX Market Buy Error:", error);
      throw error;
    }
  }

  async marketSell(instId: string, quantity: string) {
    try {
      const response = await this.client.submitOrder({
        instId: instId,
        tdMode: "cash",
        clOrdId: "b12",
        side: "sell",
        ordType: "market",
        sz: quantity,
      });
      return response;
    } catch (error) {
      console.error("OKX Market Sell Error:", error);
      throw error;
    }
  }

  async getBalance(){
    const response = await axios.get(`${this.BASE_URL_OKX}/api/v5/account/balance`);
    return response;
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
