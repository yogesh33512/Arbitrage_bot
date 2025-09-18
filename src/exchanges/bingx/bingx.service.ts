import WebSocket from "ws";
import zlib from "zlib";
import CryptoJS from "crypto-js";
import axios from "axios"


interface ChannelPayload {
  id: string;
  reqType: string;
  dataType: string;
}

export class BingXWebSocket {
  private socket!: WebSocket;
  private readonly path = "wss://open-api-swap.bingx.com/swap-market";
  private receivedMessage = "";
  // private apiKey:string;
  // private apiSecret:string;


  private readonly channel: ChannelPayload = {
    id: "24dd0e35-56a4-4f7a-af8a-394c7060909c",
    reqType: "sub",
    dataType: "BTC-USDT@lastPrice",
  };

  constructor() {
    this.init();
  }


  async marketBuy(){

  }


  async marketSell(){

  }

  private init(): void {
    this.socket = new WebSocket(this.path);

    this.socket.on("open", () => this.onOpen());
    this.socket.on("message", (msg) => this.onMessage(msg));
    this.socket.on("error", (err) => this.onError(err));
    // this.socket.on("close", () => this.onClose());
  }

  private onOpen(): void {
    console.log("✅ WebSocket connected");
    this.socket.send(JSON.stringify(this.channel));
  }

  private onError(error: Error): void {
    console.error("❌ WebSocket error:", error);
  }

  private onMessage(message: WebSocket.RawData): void {
    try {
      const buf = Buffer.isBuffer(message) ? message : Buffer.from(message as any);
      const decodedMsg = zlib.gunzipSync(buf).toString("utf-8");

      console.log("📩 Message:", decodedMsg);

      if (decodedMsg === "Ping") {
        this.socket.send("Pong");
        console.log("Pong sent ✅");
      }

      this.receivedMessage = decodedMsg;
    } catch (err) {
      console.error("⚠️ Error decoding message:", err);
    }
  }

  // private onClose(): void {
  //   console.log("🔌 WebSocket closed");
  // }

  public getLastMessage(): string {
    return this.receivedMessage;
  }
}

// Run the client
const bingxClient = new BingXWebSocket();
