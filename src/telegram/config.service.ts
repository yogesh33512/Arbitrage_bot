import {
  TelegramBot,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from "typescript-telegram-bot-api";
import { updateConfigField } from "../config/config.service";

export class ConfigService {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  async startConfig(chatId: number) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Binance", callback_data: "cex_Binance" },
          { text: "Bybit", callback_data: "cex_Bybit" },
          { text: "BingX", callback_data: "cex_BingX" },
          { text: "Mexc", callback_data: "cex_Mexc" },
          { text: "Okx", callback_data: "cex_Okx" },
        ],
      ],
    };
    try {
      await this.bot.sendMessage({
        chat_id: chatId,
        text: "Select your CEX:",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Error occured during start config: ", error);
    }
  }

  async handleCexSelection(query: any) {
    const cex = query.data.replace("cex_", "");
    await this.bot.sendMessage({
      chat_id: query.from.id,
      text: `You selected: ${cex}. Please enter the amount.`,
    });

    await this.bot.answerCallbackQuery({
      callback_query_id: query.id,
    });
  }

  async handleCurrencySelection(query: any) {
    let cex = query.data.replace("cex_", "");
    await this.bot.sendMessage({
      chat_id: query.from.id,
      text: `You selected: ${cex}. Please enter the amount.`,
    });

    cex = `capital${cex}`

    await this.bot.answerCallbackQuery({
      callback_query_id: query.id,
    });

    const amountListener = async (msg: Message) => {
      const amount = Number(msg.text);
      if (isNaN(amount) || amount <= 0) {
        this.bot.sendMessage({
          chat_id: msg.chat.id,
          text: "Please enter a valid amount.",
        });
        return;
      }

      if (!isNaN(Number(msg.text))) {
        const amount = Number(msg.text);
        
        try {
          await updateConfigField(cex,amount)
        } catch (error) {
          console.log('Erorr occured while updating config capital')
        }

        this.bot.sendMessage({
          chat_id: msg.chat.id,
          text: `Config updated with ${cex} amount $${msg.text}`,
        });

        this.bot.removeListener("message", amountListener);
      }
    };
    this.bot.on("message", amountListener);
  }

}
