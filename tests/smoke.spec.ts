import { test, expect } from '@playwright/test';

test('homepage loads without errors', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/MLZ|School|Mount/i);
});

test('role login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/login/student');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('old /login URL redirects to the home page role picker', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page).toHaveURL('http://localhost:3000/');
});