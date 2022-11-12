import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { extname } from "path";
import fg from "fast-glob";
import { createReadStream } from "fs";

const { TARGET_NAME } = process.env;
const branchName = git("git rev-parse --abbrev-ref HEAD");

if (!TARGET_NAME) process.exit();

const commitDate = git(
   'git log -1 --pretty="format:%cd" --date=format:"%H:%M:%S %d-%m-%Y"'
);
const commitHash = git("git rev-parse --short HEAD");
const lastCommitMessage = git("git show -s --format=%s");

dotenv.config();

const message = `
Branch *${branchName}* was deployed
https://${TARGET_NAME}
${commitDate}

\`\`\`
Commit: ${lastCommitMessage} / ${commitHash}
\`\`\`
`;

const artifacts = (await fg("../../dist/tests/**/*.(png|webm)")) ?? [];

console.log("artifacts", artifacts);

const ci = !!process.env.CI;

if (!ci) {
   console.warn("This is not CI env");
}

const bot = new Telegraf(process.env.TG_KEY);

const chatId = ci ? process.env.TG_CHANNEL : process.env.TG_CHAT;

await bot.telegram.sendMessage(chatId, message, { parse_mode: "Markdown" });

const journey = [];
const other = [];

for (const p of artifacts) {
   const source = createReadStream(p);
   const ext = extname(p);
   const parts = p.split("/");
   const caption = parts[parts.length - 2];
   const isVideo = ext === ".webm";
   const type = isVideo ? "video" : "photo";
   const at = { type, media: { source }, caption };
   if (p.includes("Journey")) {
      journey.push(at);
      continue;
   }
   other.push(at);
}
if (journey.length)
   await bot.telegram.sendMediaGroup(chatId, journey, {
      protect_content: true,
   });

if (other.length)
   await bot.telegram.sendMediaGroup(chatId, other, { protect_content: true });
