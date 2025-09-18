import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import { LoggerService } from './core/logger.service';
import { DatabaseService } from './core/database.service';
import { ErrorHandler } from './utils/error-handler.util';
import { BinanceService } from './exchanges/binance/binance.service';
import { BYbitService } from './exchanges/bybit/bybit.service';
import { OKXService } from './exchanges/okx/okx.service';
import { MEXCServices } from './exchanges/mexc/mexc.service';

const app = express();
const logger = new LoggerService();

// Connect to database
new DatabaseService();

app.use(express.json());
// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(ErrorHandler.handleError);

// Handle uncaught exceptions and unhandled promise rejections
ErrorHandler.handleUncaughtExceptions();
ErrorHandler.handleUnhandledRejections();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    //const binanceService = new BinanceService();
    //const bybitService = new BYbitService();
    //binanceService.connectTicker(); // You can pass btcusdt, solusdt too
    //bybitService.connectTicker()
    const okxService = new OKXService().connectTicker();
    const mexcService = new MEXCServices()
    // new MEXCWebSocket();
    logger.log(`Server is running on port ${PORT}`);
});
