import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { extname } from 'path';
import fg from 'fast-glob';
import { createReadStream } from 'fs';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
const branchDeployMap = {
	'master': 'https://bloki.app',
	'next': 'https://next.bloki.app',
}
if (!branchDeployMap[branchName]) process.exit();

const commitDate = execSync('git log -1 --pretty="format:%cd" --date=format:"%H:%M:%S %Y-%m-%d"').toString().trimEnd();
const commitHash = execSync('git rev-parse --short HEAD').toString().trimEnd();
const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

dotenv.config();

const message = `
Branch *${branchName}* was deployed
${branchDeployMap[branchName]}

\`\`\`
${commitDate}

Commit: ${lastCommitMessage} / ${commitHash}
\`\`\`
`;

const artifacts = await fg('../../dist/tests/*Journey*/**');

artifacts.forEach(p => {
	console.log(p);
})

const ci = process.env.CI === '1';

if (!ci) {
	console.warn('This is not CI env');
}

const bot = new Telegraf(process.env.TG_KEY);

const chatId = ci ? process.env.TG_CHANNEL : '205601187';

await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
const videos = [];
const images = [];
for (const p of artifacts) {
	const source = createReadStream(p);
	const ext = extname(p);

	if (ext === '.webm') {
		videos.push({ type: 'video', media: { source }, caption: p });
	}
	else if (ext === '.png') {
		images.push({ type: 'photo', media: { source }, caption: p });
	}
}

if (images.length)
	await bot.telegram.sendMediaGroup(chatId, images);

if (videos.length)
	await bot.telegram.sendMediaGroup(chatId, videos);
