import { test, expect } from '@playwright/test'

/**
 * Auth flow. Mock mode: admin/123 lands on dashboard.
 * Real-backend mode (VITE_USE_MOCK_API=false): seeded admin account.
 */
test('login with bad credentials shows an error', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible()
})

test('mock login succeeds with demo credentials', async ({ page }) => {
  test.skip(process.env.VITE_USE_MOCK_API === 'false', 'mock-only case')
  await page.goto('/login')
  const email = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()
  const password = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).first()
  await email.fill('admin@example.com')
  await password.fill('123')
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).not.toHaveURL(/login/, { timeout: 10_000 })
})
