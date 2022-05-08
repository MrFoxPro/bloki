import test from '@playwright/test';
import faker from '@faker-js/faker';

test('Journey:Joining', async ({ page }) => {
	await test.step('Open welcome page', async () => {
		await page.goto('/');
	});

	await page.waitForTimeout(300);

	await test.step('Click explore', async () => {
		await page.locator('#gotowelcome').click();
	});

	await page.waitForTimeout(300);

	await test.step('Fill fields', async () => {
		const emailInput = page.locator('#name-input');
		await emailInput.type(faker.name.findName(), { delay: 30 });

		const nameInput = page.locator('#email-input');
		await nameInput.type(faker.internet.email(), { delay: 30 });
	});
});