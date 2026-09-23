import { test, expect } from '@playwright/test'

test('workforce employees page renders list', async ({ page }) => {
  await page.goto('/workforce/employees')
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 })
})

test('departments page renders', async ({ page }) => {
  await page.goto('/workforce/departments')
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 })
})
