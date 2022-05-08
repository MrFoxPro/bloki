import { expect, test } from '@playwright/test';

test.describe('i18ts', () => {
	test('Display initial language', async ({ page }, info) => {
		await page.goto('/welcome');
		const selector = '#page-title';
		await expect(page.locator(selector)).toHaveText('Добро пожаловать!');
		await page.evaluate('setLang("en")');
		await expect(page.locator(selector)).toHaveText('Welcome!');
	});
});
