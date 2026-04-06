import { test, expect } from '@playwright/test';

test('S.M.U.V.E 4.2 branding and navigation check', async ({ page }) => {
  await page.goto('/hub');

  await expect(page).toHaveTitle(/S\.M\.U\.V\.E 4\.2/);

  await expect(page.locator('.nav-item[title="Label Hub"]')).toBeVisible();
  await expect(page.locator('.nav-item[title="Studio"]')).toBeVisible();
  await expect(page.locator('.nav-item[title="Profile"]')).toBeVisible();

  const footer = page.locator('footer');
  await expect(footer).toContainText('Smuve Jeff Presents');
});
