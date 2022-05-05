import { execSync } from 'child_process';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
const branchDeployMap = {
	'master': 'https://bloki.app',
	'next': 'https://next.bloki.app',
}
if (!branchDeployMap[branchName]) process.exit();

import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();


dotenv.config();
const bot = new Telegraf(process.env.TG_KEY);
bot.telegram.sendMessage(process.env.TG_CHANNEL,);