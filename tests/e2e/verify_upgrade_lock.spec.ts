import { test, expect } from '@playwright/test';

test('verify neural stems lock', async ({ page }) => {
  await page.goto('http://localhost:3000/dj');
  await page.waitForTimeout(2000);
  const lock = page.locator('text=Neural Stem Extraction Restricted');
  await expect(lock).toBeVisible();
});
