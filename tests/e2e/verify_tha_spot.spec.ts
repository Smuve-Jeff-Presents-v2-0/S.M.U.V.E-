import { test, expect } from '@playwright/test';
import { seedAuthenticatedSession } from './helpers';

test('Verify Tha Spot Gaming Hub and Filters', async ({ page }) => {
  await seedAuthenticatedSession(page);
  await page.goto('/tha-spot');
  const arenaSpotlight = page.getByTestId('arena-spotlight');

  await expect(page.getByRole('heading', { name: 'All Games' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Game library' })).toBeVisible();
  await expect(
    arenaSpotlight.getByRole('heading', {
      name: 'Tha Battlefield',
      exact: true,
      level: 2,
    })
  ).toBeVisible();

  await page.getByRole('button', { name: /Producer Lounge/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Producer Lounge' })
  ).toBeVisible();
  await expect(page.getByText('Producer Lounge Daily Challenge')).toBeVisible();
});
