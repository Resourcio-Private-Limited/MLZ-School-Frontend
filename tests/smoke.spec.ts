import { test, expect } from '@playwright/test';

test('homepage loads without errors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/MLZ|School|Mount/i);
});

test('login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page.getByRole('heading')).toBeVisible();
});