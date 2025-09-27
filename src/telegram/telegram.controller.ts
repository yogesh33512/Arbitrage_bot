import { TelegramBot } from "typescript-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();
import { TelegramService } from "./telegram.service";
import { ConfigService } from "./config.service";

export class TelegramController {
  private service: TelegramService;
  private configService: ConfigService;

  constructor(private bot: TelegramBot) {
    this.service = new TelegramService();
    this.configService = new ConfigService(bot);
    this.registerHandlers();
  }

  private registerHandlers() {
    this.bot.on("message", async (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;
      console.log(chatId, messageText);

      if (messageText === "/start") {
        try {
          this.bot.sendMessage({
            chat_id: chatId,
            text: "Welcome to Arbitrarge bot.",
          });
        } catch (error) {
          console.error("Error occured while sending message in /start", error);
        }
      }

      if (messageText === "/binance-quote") {
        const quote = await this.service.fetchBinancePrices();
        try {
          console.log(quote);
          await this.bot.sendMessage({
            chat_id: chatId,
            text: quote,
          });
        } catch (err) {
          console.error("Failed to send message to Telegram:", err);
        }
      }

      if (messageText === "/bybit-quote") {
        const quote = await this.service.fetchBybitPrices();
        try {
          console.log(quote);
          await this.bot.sendMessage({
            chat_id: chatId,
            text: quote,
          });
        } catch (err) {
          console.error("Failed to send message to Telegram:", err);
        }
      }

      if (messageText === "/config") {
        this.configService.startConfig(chatId);
      }
    });

    this.bot.on("callback_query", (query) => {
      const data = query.data;
      if (!data) return;
      if (data.startsWith("cex_")) {
        this.configService.handleCurrencySelection(query);
      }
    });
  }
}
