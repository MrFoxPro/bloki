import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
	testDir: './',
	outputDir: './dist',
	// globalSetup
	webServer: {
		command: 'pnpm --dir ../ start',
		port: 3000,
		reuseExistingServer: true,
	},
	use: {
		baseURL: 'http://localhost:3000',
		viewport: { width: 1280, height: 720 },
		video: 'on',
		screenshot: 'on',
		headless: true,
	},
	projects: [
		{
			name: 'Desktop Firefox',
			use: devices['Desktop Firefox'],
		},
		{
			name: 'Desktop Chrome',
			use: devices['Desktop Chrome']
		},
		{
			name: 'Desktop Safari',
			use: devices['Desktop Safari']
		}
	],
};

export default config;