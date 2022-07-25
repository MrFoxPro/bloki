import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { basename, extname } from 'path';
import fg from 'fast-glob';
import { createReadStream } from 'fs';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
const branchDeployMap = {
   'master': 'https://bloki.app',
   'next': 'https://next.bloki.app',
}
if (!branchDeployMap[branchName]) process.exit();

const commitDate = execSync('git log -1 --pretty="format:%cd" --date=format:"%H:%M:%S %d-%m-%Y"').toString().trimEnd();
const commitHash = execSync('git rev-parse --short HEAD').toString().trimEnd();
const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

dotenv.config();

const message = `
Branch *${branchName}* was deployed
${branchDeployMap[branchName]}
${commitDate}

\`\`\`
Commit: ${lastCommitMessage} / ${commitHash}
\`\`\`
`;

const artifacts = (await fg('../../dist/tests/**/*.(png|webm)')) ?? [];

console.log('artifacts', artifacts);

const ci = process.env.CI === '1';

if (!ci) {
   console.warn('This is not CI env');
}

const bot = new Telegraf(process.env.TG_KEY);

const chatId = ci ? process.env.TG_CHANNEL : process.env.TG_CHAT;

await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });

const journey = [];
const other = [];

for (const p of artifacts) {
   const source = createReadStream(p);
   const ext = extname(p);
   const parts = p.split('/');
   const caption = parts[parts.length - 2];
   const isVideo = ext === '.webm';
   const type = isVideo ? 'video' : 'photo';
   const at = { type, media: { source }, caption };
   if (p.includes('Journey')) {
      journey.push(at);
      continue;
   }
   other.push(at);
}
if (journey.length)
   await bot.telegram.sendMediaGroup(chatId, journey, { protect_content: true });

if (other.length)
   await bot.telegram.sendMediaGroup(chatId, other, { protect_content: true });
