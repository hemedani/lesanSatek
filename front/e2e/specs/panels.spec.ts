import { expect, test } from "@playwright/test"

import { storageStateFor } from "../support/api"
import { submitNewRequest } from "../support/new-request-form"
import {
  expectHealthyPage,
  waitForMainText,
  watchPageHealth,
} from "../support/page-health"

/**
 * Panel-level behaviour: the pages users actually work in every day. Each test
 * checks that real data renders, that server-side filters work, and that the
 * page did not crash on the way.
 */

test.describe("Admin panel", () => {
  test.use({ storageState: storageStateFor("manager") })

  test("user list renders records and links to detail pages", async ({
    page,
  }) => {
    const health = watchPageHealth(page)
    await page.goto("/admin/users")

    await expect(page.getByRole("heading", { name: "کاربران" })).toBeVisible()
    await waitForMainText(page)

    const recordLinks = page
      .getByRole("main")
      .locator('a[href^="/admin/users/"]')

    await expect(recordLinks.first()).toBeVisible()
    expect(await recordLinks.count()).toBeGreaterThan(0)

    await expectHealthyPage(page, health, "admin users list")
  })

  test("searching the user list narrows the results", async ({ page }) => {
    await page.goto("/admin/users")
    await waitForMainText(page)

    const allRows = await page
      .getByRole("main")
      .locator('a[href^="/admin/users/"]')
      .count()
    expect(allRows).toBeGreaterThan(0)

    await page.getByLabel("جستجوی کاربر").fill("محمد")
    await page.getByLabel("جستجوی کاربر").press("Enter")

    await expect(page).toHaveURL(/search=/)
    await waitForMainText(page)

    const filteredRows = await page
      .getByRole("main")
      .locator('a[href^="/admin/users/"]')
      .count()

    expect(filteredRows).toBeGreaterThan(0)
    expect(filteredRows).toBeLessThan(allRows)
    await expect(page.getByText("محمد انباری").first()).toBeVisible()
  })

  test("organization list opens a record", async ({ page }) => {
    const health = watchPageHealth(page)
    await page.goto("/admin/organizations")

    await expect(page.getByRole("heading", { name: "سازمان‌ها" })).toBeVisible()
    await waitForMainText(page)

    // The list also links to `/admin/organizations/add`; pick a real record.
    const hrefs = await page
      .getByRole("main")
      .locator('a[href^="/admin/organizations/"]')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")))

    const recordHref = hrefs.find((href) =>
      Boolean(href && /^\/admin\/organizations\/[a-f0-9]{24}$/.test(href)),
    )

    expect(recordHref, "organization list should link to records").toBeTruthy()

    await page.locator(`a[href="${recordHref}"]`).first().click()

    await expect(page).toHaveURL(new RegExp(`${recordHref}$`))
    await waitForMainText(page)
    await expectHealthyPage(page, health, "admin organization detail")
  })
})

test.describe("OrgHead panel", () => {
  test.use({ storageState: storageStateFor("orgHead") })

  test("dashboard renders statistics for the organization", async ({ page }) => {
    const health = watchPageHealth(page)

    await page.goto("/orghead")
    const text = await waitForMainText(page)

    expect(text.length).toBeGreaterThan(0)
    // Statistics are numeric — at least one digit group must be present.
    expect(text.replace(/[^0-9۰-۹]/g, "").length).toBeGreaterThan(0)

    await expectHealthyPage(page, health, "orghead dashboard")
  })

  test("org chart renders the unit tree", async ({ page }) => {
    const health = watchPageHealth(page)
    await page.goto("/orghead/org-chart")

    await waitForMainText(page)
    await expect(page.getByRole("button", { name: "تلاش مجدد" })).toHaveCount(0)

    await expectHealthyPage(page, health, "orghead org chart")
  })
})

test.describe("StoreHead panel", () => {
  test.use({ storageState: storageStateFor("storeHead") })

  test("stuff list renders inventory rows", async ({ page }) => {
    const health = watchPageHealth(page)
    await page.goto("/storehead/stuff")

    const text = await waitForMainText(page)
    expect(text.length).toBeGreaterThan(0)

    await expectHealthyPage(page, health, "storehead stuff")
  })
})

test.describe("Employee request center", () => {
  test.use({ storageState: storageStateFor("employee") })

  test("my-requests renders the request list", async ({ page }) => {
    const health = watchPageHealth(page)
    await page.goto("/requests/my-requests")

    const text = await waitForMainText(page)
    expect(text.length).toBeGreaterThan(0)

    await expectHealthyPage(page, health, "my requests")
  })

  test("new request form validates required fields", async ({ page }) => {
    await page.goto("/requests/new")

    await expect(
      page.getByRole("heading", { name: "ثبت درخواست خرید جدید" }),
    ).toBeVisible()

    // `quantity` defaults to "1", so clear it to exercise the required rule.
    await page.getByRole("spinbutton").fill("")
    await submitNewRequest(page)

    await expect(page.getByText("عنوان الزامی است")).toBeVisible()
    await expect(page.getByText("تعداد الزامی است")).toBeVisible()
    await expect(page.getByText("مدل کالا الزامی است")).toBeVisible()

    // Still on the form — nothing was submitted.
    await expect(page).toHaveURL(/\/requests\/new/)
  })
})
