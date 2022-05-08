import { PlaywrightTestConfig, devices, PlaywrightTestProject } from '@playwright/test';

const ci = process.env.CI === '1';
if (ci) {
	console.log('Running tests in production mode');
}

const journeys: PlaywrightTestProject[] = [
	{
		name: 'Desktop Chrome 16x9',
		use: {
			...devices['Desktop Chrome'],
			viewport: {
				width: 1920,
				height: 1080
			},
		}
	},
	{
		name: 'Desktop Chrome 4x3',
		use: {
			...devices['Desktop Chrome'],
			viewport: {
				width: 1280,
				height: 1024,
			},
		}
	},
	{
		name: 'iPhone 12 Mini',
		use: {
			...devices['iPhone 12 Mini']
		}
	},
];

for (const p of journeys) {
	p.testDir = './journeys';
	p.use.video = {
		mode: 'on',
		size: p.use.viewport
	};
}

const straight: PlaywrightTestProject[] = [
	{
		name: 'Desktop Chrome',
		use: {
			...devices['Desktop Chrome']
		}
	}
];

for (const p of straight) {
	p.use.screenshot = 'on';
	p.testDir = './';
	p.testIgnore = /.*\/journeys\//;
}

const config: PlaywrightTestConfig = {
	outputDir: '../dist/tests',
	webServer: {
		command: 'pnpm --dir ../ dev',
		port: 3000,
		reuseExistingServer: true,
	},
	timeout: ci ? 10000 : undefined,
	use: {
		baseURL: 'http://localhost:3000',
		locale: 'ru',
		headless: ci,
	},
	projects: straight.concat(journeys),
};

export default config;