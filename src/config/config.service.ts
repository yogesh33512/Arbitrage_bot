import { Config } from "./config.model";
import dotenv from "dotenv";
dotenv.config();

export const seedConfig = async () => {
  try {
    const count = await Config.countDocuments();
    if (count === 0) {
      await Config.create({
        capitalBinance: process.env.TRADE_AMOUNT,
        capitalBybit: process.env.TRADE_AMOUNT,
        capitalBingX: process.env.TRADE_AMOUNT,
        capitalMexc: process.env.TRADE_AMOUNT,
        capitalOkx: process.env.TRADE_AMOUNT,
        profitThreshold: 2,
        slippageTolerance: 0.5,
      });

      console.log("Default config seeded.");
    } else {
      console.log("Config already existed, skipping seed config.");
    }
  } catch (error) {
    console.error("Error occured while seeding config: ", error);
  }
};
