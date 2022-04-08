import dotenv from 'dotenv';
dotenv.config();
import util from 'util';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TG_KEY);

export const tg = (...args: string[]) => {
   if (process.env.MODE !== 'prod') return null;
   return bot.telegram.sendMessage(process.env.TG_CHAT, util.format(`[${process.env.MODE ?? 'dev'}]: ${args[0]}`, ...args.slice(1)));
};
