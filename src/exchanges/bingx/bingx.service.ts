import WebSocket from "ws";
import zlib from "zlib";
import CryptoJS from "crypto-js";
import axios, {AxiosRequestConfig} from "axios"
import { APIRequest, exchangeQuoteSymbol } from "./bingx.types";
import dotenv from "dotenv";
dotenv.config();



interface ChannelPayload {
  id: string;
  reqType: string;
  dataType: string;
}

export class BingXServices {  
  private socket!: WebSocket;
  private readonly path = "wss://open-api-swap.bingx.com/swap-market";
  private receivedMessage = "";
  private apiKey:string;
  private apiSecret:string;
  private host:string;
  // private API:APIRequest


  private readonly channel: ChannelPayload = {
    id: "24dd0e35-56a4-4f7a-af8a-394c7060909c",
    reqType: "sub",
    dataType: "BTC-USDT@lastPrice",
  };

  constructor() {
    // this.init();
    this.host='open-api.bingx.com'
    this.apiSecret = process.env.BINGX_SECRET as string
    this.apiKey = process.env.BINGX_API_KEY as string
  }



  private getParameters(api:APIRequest, timestamp:number, urlEncoded:boolean){
    let parameters = ""
    for(const key in api.payload){
      const value = (api.payload as any)[key];
      if(urlEncoded){
        parameters += key + '=' + encodeURIComponent(value) + '&';
      }else{
        parameters += key + '=' + value + '&'
      }
    }

    if(parameters){
      parameters = parameters.substring(0,parameters.length - 1);
      parameters = parameters + '&timestamp=' + timestamp
    }else{
      parameters = 'timestamp=' + timestamp;
    }

    return parameters;
  }

  private sign(params:string):string{
    return CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(params,this.apiSecret));
  }

  async sendRequest(api:APIRequest){
    const timestamp = Date.now();
    const params = this.getParameters(api,timestamp,true);
    const sign = this.sign(this.getParameters(api,timestamp,false)); // Check this boolean flag if the urlEncoded has special chars
    const url = `${api.protocol}://${this.host}${api.uri}?${params}&signature=${sign}`

    const config:AxiosRequestConfig = {
      method: api.method,
      url,
      headers:{
        'X-BX-APIKEY':this.apiKey
      }
    }

    const resp = await axios(config)
    return resp.data;
  }

  async marketBuy(symbol:string, quantity:number){
      const api:APIRequest = {
      uri:"/openApi/spot/v1/trade/order",
      method:'POST',
      payload:{
        type:'MARKET',
        symbol:symbol,
        side:'BUY',
        quantity:quantity,
        recvWindow:5000,
        timeInForce:'GTC',
        timestamp:Date.now()
      },
      protocol:'https'
    }

    return this.sendRequest(api)
  }


  async marketSell(symbol:string, quantity:number){
    const api:APIRequest = {
      uri:"/openApi/spot/v1/trade/order",
      method:'POST',
      payload:{
        type:'MARKET',
        symbol:symbol,
        side:'SELL',
        quantity:quantity,
        recvWindow:5000,
        timeInForce:'GTC',
        timestamp:Date.now()
      },
      protocol:'https'
    }

    return this.sendRequest(api)
  }



  async checkBalance(asset?: string) {
  const api: APIRequest = {
    uri: "/openApi/spot/v1/account/balance",
    method: "GET",
    payload: {},  
    protocol: "https"
  };


  const response = await this.sendRequest(api);

  if (asset) {
    const balance = response.data.find((b: any) => b.asset === asset);
    return balance || { asset, free: "0", locked: "0" };
  }

  return response;
  }


  async exchangeQuote(symbol:exchangeQuoteSymbol){
    const url = `https://open-api.bingx.com/openApi/spot/v1/ticker/price`;
    const response = await axios.get(url,{
      params:{symbol}
    })
    return response?.data?.data[0].trades;
  }


  /** ============ WEBSOCKET METHODS ============ **/


  public connectTicker(): void {
    this.init();
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
// const bingxClient = new BingXWebSocket();
