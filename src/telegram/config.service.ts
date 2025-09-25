import {
  TelegramBot,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from "typescript-telegram-bot-api";
export class ConfigService {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  async startConfig(chatId: number) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Binance", callback_data: "cex_binance" },
          { text: "Bybit", callback_data: "cex_bybit" },
          { text: "BingX", callback_data: "cex_bingx" },
          { text: "Mexc", callback_data: "cex_mexc" },
          { text: "Okx", callback_data: "cex_okx" },
        ],
      ],
    };

    await this.bot.sendMessage({
      chat_id: chatId,
      text: "Select your CEX:",
      reply_markup: keyboard,
    });
  }

  async handleCexSelection(query: any) {
    const cex = query.data.replace("cex_", "");
    await this.bot.sendMessage({
      chat_id: query.from.id,
      text: `You selected: ${cex}`,
    });

    const currencyButtons: InlineKeyboardButton[][] = [
      [{ text: "ETH", callback_data: `currency_ETH_${cex}` }],
      [{ text: "SOL", callback_data: `currency_SOL_${cex}` }],
      [{ text: "BTC", callback_data: `currency_BTC_${cex}` }],
    ];

    await this.bot.answerCallbackQuery({
      callback_query_id: query.id,
    });

    await this.bot.sendMessage({
      chat_id: query.from.id,
      text: `You selected: ${cex}. Now pick a currency:`,
      reply_markup: {
        inline_keyboard: currencyButtons,
      },
    });
  }

  async handleCurrencySelection(query: any) {
    const [_, currency, cex] = query.data.split("_");

    await this.bot.sendMessage({
      chat_id: query.from.id,
      text: `You selected ${currency} on ${cex}. Now enter the amount:`,
    });

    await this.bot.answerCallbackQuery({
      callback_query_id: query.id,
    });

    const amountListener = (msg: Message) => {
      if (!isNaN(Number(msg.text))) {
        const amount = Number(msg.text);
        this.bot.sendMessage({
          chat_id: msg.chat.id,
          text: `Config saved:\nCEX: ${cex}\nCurrency: ${currency}\nAmount: ${amount}`,
        });

        this.bot.removeListener("message", amountListener);
      } else {
         this.bot.sendMessage({
          chat_id: msg.chat.id,
          text: "Please enter a valid number.",
        });
      }
    };

    this.bot.on("message", amountListener);
  }
}
