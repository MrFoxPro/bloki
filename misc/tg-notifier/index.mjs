import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { readdir, readFile } from 'fs/promises';
import { extname, resolve } from 'path';
import fg from 'fast-glob';
import { createReadStream } from 'fs';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
const branchDeployMap = {
	'master': 'https://bloki.app',
	'next': 'https://next.bloki.app',
}
if (!branchDeployMap[branchName]) process.exit();

const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

dotenv.config();
const bot = new Telegraf(process.env.TG_KEY);

const message = `
	Branch ${branchName} was deployed to ${branchDeployMap[branchName]}.

	${commitDate}
	${commitHash}
	${lastCommitMessage}
`;

const artifacts = await fg('../../dist/tests/*Journey*/**');

artifacts.forEach(p => {
	console.log(p);
})

if (process.env.CI !== '1') {
	console.warn('This is not CI env');
	process.exit();
}

const chatId = process.env.TG_CHANNEL;

await bot.telegram.sendMessage(chatId, message);

for (const p of artifacts) {
	const file = createReadStream(p);
	const ext = extname(p);

	if (ext === '.webm') {
		await bot.telegram.sendVideo(chatId, file);
	}
	else if (ext === '.png') {
		await bot.telegram.sendPhoto(chatId, file);
	}
}

