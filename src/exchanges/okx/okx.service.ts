import WebSocket from "ws";

interface SubscribeMsg {
  op: string;
  args: { channel: string; instId: string }[];
}

export class OKXWebSocket {
  private socket!: WebSocket;
  private readonly url = "wss://wspap.okx.com:8443/ws/v5/public?brokerId=9999";
  private readonly symbols = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];

  constructor() {
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
