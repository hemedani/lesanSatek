import { expect, test } from "@playwright/test"

import { TOKEN_COOKIE } from "../../src/lib/session-cookies"
import { PERSONAS } from "../support/personas"
import { ERROR_BOUNDARY_TEXT } from "../support/page-health"

/**
 * Authentication is the gate for every other flow, so it is tested against the
 * real login form (the rest of the suite authenticates through the API for
 * speed — see `setup/auth.setup.ts`).
 */

test.describe("Authentication", () => {
  test("login page renders in Persian with RTL layout", async ({ page }) => {
    await page.goto("/login")

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(
      page.getByRole("heading", { name: "ورود به ساتک" }),
    ).toBeVisible()

    await expect(page.getByLabel("ایمیل یا شماره موبایل", { exact: true })).toBeVisible()
    await expect(page.getByLabel("رمز عبور", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "ورود به سامانه" }),
    ).toBeVisible()

    // No English leakage in the UI.
    await expect(page.getByText("Sign in", { exact: false })).toHaveCount(0)
  })

  test("shows an inline error for wrong credentials", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("ایمیل یا شماره موبایل", { exact: true }).fill("wh.a@lesansatek.com")
    await page.getByLabel("رمز عبور", { exact: true }).fill("definitely-not-the-password")
    await page.getByRole("button", { name: "ورود به سامانه" }).click()

    // Scoped to the form: Next.js renders its own `role="alert"` route announcer.
    const alert = page.locator('form [role="alert"]')
    await expect(alert).toBeVisible()
    await expect(alert).not.toBeEmpty()
    await expect(page).toHaveURL(/\/login/)
  })

  test("unit head signs in and lands on the unit-head dashboard", async ({
    page,
  }) => {
    const persona = PERSONAS.unitHeadWarehouse

    await page.goto("/login")
    await page.getByLabel("ایمیل یا شماره موبایل", { exact: true }).fill(persona.email)
    await page.getByLabel("رمز عبور", { exact: true }).fill(persona.password)
    await page.getByRole("button", { name: "ورود به سامانه" }).click()

    await expect(page).toHaveURL(/\/unit-head$/, { timeout: 60_000 })
    await expect(
      page.getByRole("link", { name: /در انتظار تأیید/ }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: ERROR_BOUNDARY_TEXT }),
    ).toHaveCount(0)
  })

  test("unauthenticated visitors are redirected to login with a return path", async ({
    page,
  }) => {
    await page.context().clearCookies()
    await page.goto("/unit-head/requests/pending")

    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).toContain("redirect=")
  })

  test("logging out clears the session and returns to login", async ({
    page,
  }) => {
    const persona = PERSONAS.unitHeadWarehouse

    await page.goto("/login")
    await page.getByLabel("ایمیل یا شماره موبایل", { exact: true }).fill(persona.email)
    await page.getByLabel("رمز عبور", { exact: true }).fill(persona.password)
    await page.getByRole("button", { name: "ورود به سامانه" }).click()
    await expect(page).toHaveURL(/\/unit-head$/, { timeout: 60_000 })

    await page.getByRole("button", { name: "منوی حساب کاربری" }).click()
    await page.getByText("خروج از حساب").click()

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

    const cookies = await page.context().cookies()
    expect(cookies.find((c) => c.name === TOKEN_COOKIE)).toBeUndefined()
  })
})
