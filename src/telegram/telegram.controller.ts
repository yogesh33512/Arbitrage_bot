import { TelegramBot } from "typescript-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();
import { TelegramService } from "./telegram.service";

export class TelegramController {
  private service: TelegramService;

  constructor(private bot: TelegramBot) {
    this.service = new TelegramService();
    this.registerHandlers();
  }

  private registerHandlers() {
    this.bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;
      console.log(chatId, messageText);

      if (messageText === "/start") {
        this.bot.sendMessage({
          chat_id: chatId,
          text: "Welcome to Arbitrarge bot.",
        });
      }
    });
  }
}
