import { expect, test } from '@playwright/test';

import ru from '~client/modules/i18n/langs/ru.lang';
import en from '~client/modules/i18n/langs/en.lang';
import zhCn from '~client/modules/i18n/langs/zh-cn.lang';

test.describe('i18ts', () => {
	test('Display initial language', async ({ page }, info) => {
		await page.goto('/welcome');
		const title = page.locator('html body main.page-Ju.mosaic-JM.welcome-Gl div.waterfall-mG div.page-title-6a');
		expect(title).toHaveText(ru.page.welcome.title);
	});
});
