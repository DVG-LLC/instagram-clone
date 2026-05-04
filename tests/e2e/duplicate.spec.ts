import { test, expect } from '@playwright/test'

// This e2e test requires the dev server running at http://localhost:5173
// Run it locally with: pnpm playwright:install && pnpm dev (in a separate shell) && pnpm playwright:test

test('duplicate topic via UI', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Topic Duplicator')

  // Ensure a Duplicate button exists and click the first one
  const dupButton = page.locator('button', { hasText: 'Duplicate' }).first()
  await expect(dupButton).toBeVisible()
  await dupButton.click()

  // The UI shows a status message acknowledging duplication
  const status = page.getByRole('status')
  await expect(status).toContainText('Duplicated topic')
})
