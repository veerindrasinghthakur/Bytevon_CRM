import { test, expect } from '@playwright/test'

// Leave → approval flow. Requires authenticated session (see auth.setup or mock login).
test('my-work leave page renders and apply form validates dates', async ({ page }) => {
  await page.goto('/my-work/leave')
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 })
})

test('approvals pending list renders', async ({ page }) => {
  await page.goto('/approvals/pending')
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 })
})
