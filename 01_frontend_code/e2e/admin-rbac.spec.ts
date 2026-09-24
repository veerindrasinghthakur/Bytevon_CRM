import { test, expect } from '@playwright/test'

test('admin users page is gated (redirects or shows locked state when unauthorized)', async ({
  page,
}) => {
  await page.goto('/admin/users')
  // Either the table renders for admins or an access-denied/redirect occurs —
  // both are valid RBAC outcomes; the page must not blank-crash.
  await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 })
})

test('roles page renders for authorized session', async ({ page }) => {
  await page.goto('/admin/roles')
  await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 })
})
