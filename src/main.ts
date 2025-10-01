import express, { response } from "express";
import * as dotenv from "dotenv";
dotenv.config();
import { LoggerService } from "./core/logger.service";
import { DatabaseService } from "./core/database.service";
import { ErrorHandler } from "./utils/error-handler.util";
import { binanceService } from "./exchanges";
import { bybitService } from "./exchanges/bybit/bybit.service";
import { OKXService } from "./exchanges/okx/okx.service";
import { mexcService } from "./exchanges/mexc/mexc.service";
import { bingxService } from "./exchanges/bingx/bingx.service";
import { TelegramBot } from "typescript-telegram-bot-api";
import { TelegramController } from "./telegram/telegram.controller";
import { exchangeQuoteSymbol } from "./exchanges/binance/binance.types";
import { bingXQuoteSymbol } from "./exchanges/bingx/bingx.types";
import { arbitration } from "./arbitrage/arbitrage.service";
import { ExchangeAdapter } from "./arbitrage/arbitrage.types";
import { BinanceAdapter } from "./adapters/binanceAdapter";
import { BingXAdapter } from "./adapters/bingXAdapter";

const app = express();
const logger = new LoggerService();

// Connect to database
new DatabaseService();

app.use(express.json());
// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(ErrorHandler.handleError);

// Handle uncaught exceptions and unhandled promise rejections
ErrorHandler.handleUncaughtExceptions();
ErrorHandler.handleUnhandledRejections();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const symbol = "SOLUSDT";
  const size = 0.5;

  const exchanges: ExchangeAdapter[] = [
    new BingXAdapter(),
    new BinanceAdapter(),

    // add more exchange adapters here
  ];

  console.log("[Main] Starting arbitrage scanner");
  console.log(`[Main] Trading Symbol: ${symbol}, Trade Size: ${size}`);
  console.log(`[Main] Exchanges: ${exchanges.map((ex) => ex.name).join(", ")}`);

  setInterval(async () => {
    console.log("\n[Main] ----- Starting new scan -----");

    try {
      const opportunities = await arbitration.ArbitrationScanner(
        exchanges,
        symbol,
        size,
        0.5
      );

      console.log(
        `[Main] Scan complete. Opportunities found: ${opportunities.length}`
      );

      if (opportunities.length === 0) {
        console.log("[Main] No arbitrage opportunities at this time.");
      }

      for (const arb of opportunities) {
        console.log(
          `[Main] Executing opportunity: Buy ${arb.size} ${arb.symbol} on ${arb.buyExchange.name}, Sell on ${arb.sellExchange.name}`
        );
        await arbitration.arbitrargeExecution(arb);
        console.log("[Main] Opportunity execution completed\n");
      }
    } catch (err) {
      console.error("[Main] Error during scan/execution:", err);
    }

    console.log("[Main] ----- Scan cycle complete -----");
  }, 2000);

  /*
  //Binance
  // const binanceService = new BinanceService();

  binanceService.userDataStream()


  binanceService.marketBuy("SOLUSDT", 0.08).then((response) => {
    console.log(`Binance market buy response: `, response);
  }).catch(err=>console.log(`Binance marketbuy error: `, err.response?.data || err.message))
  

  binanceService.marketSell('SOLUSDT',0.08).then(response=>{
    console.log(`Binance market sell response`, response)
  }).catch(err => console.log(`Binance market sell error: `, err));
  */

  /*
  //mexc
  const mexcService = new MEXCServices();

  mexcService.checkBalance().then((response)=>{
    console.log('MEXC check balance response: ',response.balances)
  }).catch((err)=>{
    console.log('MEXC check balance error: ',err)
  })
    

  
  mexcService
    .marketBuy("SOLUSDT", "", "1")
    .then((response) => {
      console.log("MEXC market buy response: ", response);
    })
    .catch((err) => {
      console.log("MEXC market buy error: ", JSON.parse(err.body.toString()));
    });

  
  mexcService.marketSell('SOLUSDT',"1").then((response)=>{
    console.log('MEXC market sell response: ',response)
  }).catch((err)=>{
    console.log('MEXC market sell error: ',JSON.parse(err.body.toString()))
  })
  */

  //Bybit
  // const bybitService = new BYbitService();

  /*
  bybitService.checkBalance()
    .then((response) => {
      console.log(response.result.list[0].coin);})
    .catch((error) => {
      console.error(error);
    });

  */

  /*
  bybitService
    .marketBuy("SOLUSDT", "1").then((response) => {
      console.log(`Bybit market buy response: `, response);
    }).catch((err) =>
      console.log(`Bybit marketbuy error: `, err.rsponse?.data || err.message)
    );
    */

  /*
bybitService.marketSell('SOLUSDT',"1").then(response=>{
  console.log(`Bybit market sell response: `, response)
}).catch(err =>{
  console.log(`Bybit marketsell error: `, err.rsponse?.data || err.message)
})


 
/*
  bybitService.orderStatus().then((response)=>{
    console.log(response.result);
  })
  */

  //OKXServices

  /*
  const okxService = new OKXService();

   okxService.marketBuy('SOL-USDT','0.01').then(response =>{
       console.log(`OKX market buy response: `, response)
   }).catch(err=>console.log(`BingX marketbuy error: `, err.response?.data || err.message));

  okxService
    .getBalance()
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.log(err);
    });

    */

  /*  
    //bingXServies

    const bingXService = new BingXServices();

    bingXService.checkBalance().then((response)=>{
      console.log('BingX Check Balance resposne: ', response.data.balances);
    }).catch((err)=>{
      console.log('BingX Check Balance error', err)
    })

 
    bingXService.marketBuy('SOL-USDT',0.008).then((response)=>{
        console.log(`BingX market buy response: `, JSON.stringify(response, null, 2))
    }).catch(err=>console.log(`BingX marketbuy error: `, err.response?.data || err.message));
    
  
    bingXService.marketSell('BTC-USDT',0.001).then(response => {
        console.log(`BingX market sell response: `, JSON.stringify(response, null, 2))
    }).catch(err=>console.log(`BingX marketsell error: `, err.rsponse?.data || err.message));
    */

  //Telegram Initialization
  const bot = new TelegramBot({
    botToken: "8386977037:AAE9hnOfqG2r1Zf7ix9h7e-1w2WHp-NXqJQ",
  });
  bot.startPolling();
  new TelegramController(bot);

  console.log("🤖 Telegram bot is running...");

  logger.log(`Server is running on port ${PORT}`);
});
