import { RestClientV5 } from "bybit-api";
import WebSocket from "ws";
import { exchangeQuoteSymbol } from "./bybit.types";

const { BYBIT_WS_URL, BYBIT_API_KEY_TESTNET, BYBIT_API_SECRET_TESTNET } =
  process.env;

class BYbitService {
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
      recv_window: 10000,
    });
  }

  async marketBuy(symbol: string, quantity: string) {
    console.log('market buy bybit----------------->')
    try {
      const response = await this.client.submitOrder({
        category: "spot",
        symbol,
        side: "Buy",
        orderType: "Market",
        qty: quantity,
        // marketUnit:'quoteCoin'
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
        side: "Sell",
        orderType: "Market",
        qty: quantity,
      });
      return response;
    } catch (error) {
      console.error("Market Buy Error:", error);
      throw error;
    }
  }

  async checkBalance() {
    try {
      const response = await this.client.getWalletBalance({
        coin: "BTC",
        accountType: "UNIFIED",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async orderStatus() {
    const response = await this.client.getHistoricOrders({
      category: "spot",
      symbol: "SOLUSDT",
    });
    return response;
  }

  async exchangeQuote(symbol: exchangeQuoteSymbol) {
    const response = await this.client.getTickers({ category: "spot", symbol });
    return response;
  }

  async getOrderBook(
    symbol: string,
    depth = 5
  ): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    try {

      const response = await this.client.getOrderbook({
        category: "spot",
        symbol,
        limit: depth,
      });
      
      const bids = response.result.b.map(
        ([price, qty]: [string, string]) =>
          [Number(price), Number(qty)] as [number, number]
      );


      const asks = response.result.a.map(
        ([price, qty]: [string, string]) =>
          [Number(price), Number(qty)] as [number, number]
      );
      //console.log('bybit asks:---------->', bids);
      //console.log('bybit asks----------->', asks);
      return { bids, asks };
    } catch (error) {
      console.error("Error fetching order book:", error);
      return { bids: [], asks: [] };
    }
  }

  connectTicker() {
    this.ws = new WebSocket(BYBIT_WS_URL!);

    this.ws.on("open", () => {
      console.log(`✅ Connected to bybit Testnet:}`);
      console.log(BYBIT_WS_URL);

      this.ws?.send(
        JSON.stringify({
          op: "subscribe",
          args: ["tickers.ETHUSDT", "tickers.BTCUSDT", "tickers.SOLUSDT"],
          // args: [ "orderbook.50.BTCUSDT","orderbook.50.ETHUSDT","orderbook.50.SOLUSDT"],
          req_id: "orderbook_sub",
        })
      );
    });

    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log(msg);
      // console.log("msg b------------------>",msg?.data?.b);
      // console.log("msg a------------------>",msg?.data?.b);
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

export const bybitService = new BYbitService();
