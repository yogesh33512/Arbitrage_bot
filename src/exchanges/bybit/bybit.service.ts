import WebSocket from "ws";

const { BYBIT_WS_URL } = process.env;

export class BYbitService {
    private ws: WebSocket | null = null;

    connectTicker() {
        this.ws = new WebSocket(BYBIT_WS_URL!);

        this.ws.on("open", () => {
            console.log(`✅ Connected to bybit Testnet:}`);

            this.ws?.send(JSON.stringify({
                op: "subscribe",
                args: [
                    "tickers.ETHUSDT",
                    "tickers.BTCUSDT",
                    "tickers.SOLUSDT",
                ],
                req_id: "price_sub"
            }));

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
