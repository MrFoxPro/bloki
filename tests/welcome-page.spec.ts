import { test, expect } from '@playwright/test';

test.describe('Welcome page', () => {
	test('Display page', async ({ page }, info) => {
		await page.goto('/welcome');
		// const title = page.locator('.navbar__inner .navbar__title');
		// await expect(title).toHaveText('Playwright');
	});
});
