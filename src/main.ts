import express, { response } from "express";
import * as dotenv from "dotenv";
dotenv.config();
import { LoggerService } from "./core/logger.service";
import { DatabaseService } from "./core/database.service";
import { ErrorHandler } from "./utils/error-handler.util";
import { BinanceService } from "./exchanges/binance/binance.service";
import { BYbitService } from "./exchanges/bybit/bybit.service";
import { OKXService } from "./exchanges/okx/okx.service";
import { MEXCServices } from "./exchanges/mexc/mexc.service";
import { BingXServices } from "./exchanges/bingx/bingx.service";

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
  /*
  //Binance
  const binanceService = new BinanceService();

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
  //const bybitService = new BYbitService();

  
  /*
  bybitService.checkBalance()
    .then((response) => {
      console.log(response.result.list[0].coin);})
    .catch((error) => {
      console.error(error);
    });

  */




  // bybitService
  //   .marketBuy("SOLUSDT", "50").then((response) => {
  //     console.log(`Bybit market buy response: `, response);
  //   }).catch((err) =>
  //     console.log(`Bybit marketbuy error: `, err.rsponse?.data || err.message)
  //   );
    


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


  /*
    //OKXServices

    const okxService = new OKXService();

    okxService.marketBuy('BTC-USDT','0.0000000000001').then(response =>{
        console.log(`OKX market buy response: `, response)
    }).catch(err=>console.log(`BingX marketbuy error: `, err.rsponse?.data || err.message));
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

  logger.log(`Server is running on port ${PORT}`);
});
