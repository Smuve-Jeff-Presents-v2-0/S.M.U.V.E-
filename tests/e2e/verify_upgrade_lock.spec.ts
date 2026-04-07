import { test, expect } from '@playwright/test';

test('verify studio auth guard redirects unauthenticated users', async ({
  page,
}) => {
  await page.goto('/studio');
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: /S\.M\.U\.V\.E\./i })
  ).toBeVisible();
  await expect(page.getByText('Strategic Candidate Authorization')).toBeVisible();
});
