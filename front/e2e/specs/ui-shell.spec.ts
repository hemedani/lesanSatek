import { expect, test } from "@playwright/test"

import { storageStateFor } from "../support/api"
import { expectHealthyPage, watchPageHealth } from "../support/page-health"

/**
 * App shell behaviour shared by every panel: RTL direction, the design-system
 * canvas, sidebar active state, the command palette, and the mobile drawer.
 */

test.describe("App shell", () => {
  test.use({ storageState: storageStateFor("manager") })

  test("document is Persian and right-to-left", async ({ page }) => {
    await page.goto("/admin")

    const html = page.locator("html")
    await expect(html).toHaveAttribute("dir", "rtl")
    await expect(html).toHaveAttribute("lang", "fa")

    // Midnight Ink canvas from the design system.
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    )
    expect(background).toBe("rgb(5, 6, 15)")
  })

  test("sidebar marks the current route as the active page", async ({
    page,
  }) => {
    await page.goto("/admin/users")

    const nav = page.locator('nav[aria-label="ناوبری اصلی"]')

    await expect(nav.locator('a[href="/admin/users"][aria-current="page"]')).toHaveCount(1)

    // The panel root must not stay highlighted on child routes.
    await expect(nav.locator('a[href="/admin"][aria-current="page"]')).toHaveCount(0)
  })

  test("command palette searches routes and navigates", async ({ page }) => {
    const health = watchPageHealth(page)

    await page.goto("/admin")
    await page.getByRole("button", { name: "جستجو در سامانه" }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    const input = dialog.getByPlaceholder("جستجو در سامانه...")
    await input.fill("کاربران")

    const firstResult = dialog.getByRole("option").first()
    await expect(firstResult).toBeVisible()
    await expect(firstResult).toContainText("کاربران")
    await firstResult.click()

    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 30_000 })
    await expectHealthyPage(page, health, "command palette navigation")
  })

  test("mobile drawer exposes the same navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/admin")

    await page.getByRole("button", { name: "باز کردن منو" }).click()

    const drawerNav = page.getByRole("navigation", { name: "ناوبری اصلی" })
    await expect(drawerNav).toBeVisible()
    await expect(
      drawerNav.locator('a[href="/admin/users"]').first(),
    ).toBeVisible()
  })
})
