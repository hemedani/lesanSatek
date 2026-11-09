import { expect, test } from "@playwright/test"

import { storageStateFor } from "../support/api"
import { cardCount, faNumber, metricValue, openPage } from "../support/domain"
import { expectHealthyPage, waitForStableMain, watchPageHealth } from "../support/page-health"

/**
 * Budget: fiscal years, budget lines, and the reports that summarise them.
 *
 * The arithmetic is the point. Every budget line must satisfy
 *   remaining = allocated − committed − consumed
 * and every summary must equal the sum of the lines it aggregates. A wrong
 * remaining figure is invisible until someone overspends.
 */

/**
 * Text of every budget-line card on the page.
 *
 * Line cards are identified by their `BUD-…` code — the summary strip above the
 * list also mentions "باقی‌مانده", so matching on that word alone picks up the
 * totals card and then fails looking for a per-line allocation.
 */
async function budgetCardTexts(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("main div")).filter(
      (element) => {
        const classes = element.className
        if (typeof classes !== "string" || !classes.includes("glass-card")) return false

        const text = element.textContent ?? ""
        return /BUD-[A-Za-z0-9-]+/.test(text)
      },
    )

    // Keep the innermost matching cards so nested wrappers are not counted twice.
    const innermost = cards.filter(
      (element) =>
        !Array.from(element.querySelectorAll("div")).some((child) => {
          const classes = child.className
          return (
            typeof classes === "string" &&
            classes.includes("glass-card") &&
            /BUD-[A-Za-z0-9-]+/.test(child.textContent ?? "")
          )
        }),
    )

    return innermost.map((element) =>
      (element.textContent ?? "").replace(/\s+/g, " ").trim(),
    )
  })
}

test.describe("Budget — admin", () => {
  test.use({ storageState: storageStateFor("manager") })

  test("fiscal years list their period and status", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, "/admin/fiscal-years")

    await expect(
      page.getByRole("heading", { level: 1, name: "سال‌های مالی" }),
    ).toBeVisible()

    expect(text).toMatch(/۲ سال مالی/)
    expect(text).toMatch(/باز|فعال|بسته شده/)

    const cards = await cardCount(page)
    expect(cards).toBeGreaterThanOrEqual(2)

    await expectHealthyPage(page, health, "fiscal years")
    health.stop()
  })

  test("every budget line keeps remaining = allocated − committed − consumed", async ({
    page,
  }) => {
    await openPage(page, "/admin/budget-lines")

    const cards = await budgetCardTexts(page)
    expect(cards.length, "no budget line cards rendered").toBeGreaterThanOrEqual(8)

    for (const text of cards) {
      const allocated = metricValue(text, "تخصیص یافته")
      const committed = metricValue(text, "تعهد شده")
      const consumed = metricValue(text, "مصرف شده")
      const remaining = metricValue(text, "باقی‌مانده")

      expect(
        remaining,
        `remaining must equal allocated − committed − consumed in: ${text.slice(0, 120)}`,
      ).toBe(allocated - committed - consumed)
    }
  })

  test("the budget report asks for a fiscal year before showing figures", async ({
    page,
  }) => {
    const text = await openPage(page, "/admin/budget-reports")

    await expect(
      page.getByRole("heading", { level: 1, name: "گزارش بودجه" }),
    ).toBeVisible()

    expect(text).toContain("ابتدا یک سال مالی انتخاب کنید")

    await page.getByLabel("انتخاب سال مالی برای گزارش", { exact: true }).click()
    await page.getByRole("option").first().click()

    await expect
      .poll(() => page.url(), { message: "fiscal year selection did not persist" })
      .toMatch(/fiscalYearId=|yearId=|fiscalYear=/)

    const settled = await waitForStableMain(page)
    expect(settled).not.toContain("ابتدا یک سال مالی انتخاب کنید")
  })
})

test.describe("Budget — unit head (finance)", () => {
  test.use({ storageState: storageStateFor("unitHeadFinance") })

  test("the finance dashboard totals add up", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, "/unit-head/finance")

    await expect(
      page.getByRole("heading", { level: 1, name: "داشبورد مالی" }),
    ).toBeVisible()

    const total = metricValue(text, "بودجه کل")
    const consumed = metricValue(text, "مصرف شده")
    const remaining = metricValue(text, "باقی‌مانده")

    expect(total).toBeGreaterThan(0)
    expect(remaining, "remaining must equal total − consumed").toBe(total - consumed)

    await expectHealthyPage(page, health, "finance dashboard")
    health.stop()
  })

  test("the budget line summary equals the sum of its lines", async ({ page }) => {
    const text = await openPage(page, "/unit-head/finance/budget-lines")

    const headerAllocated = metricValue(text, "مجموع تخصیص")
    const headerConsumed = metricValue(text, "مجموع مصرف")
    const headerRemaining = metricValue(text, "باقی‌مانده کل")

    expect(headerRemaining).toBe(headerAllocated - headerConsumed)

    const cards = await budgetCardTexts(page)
    expect(cards.length).toBeGreaterThan(0)

    const sumAllocated = cards.reduce(
      (total, card) => total + metricValue(card, "تخصیص"),
      0,
    )
    const sumConsumed = cards.reduce(
      (total, card) => total + metricValue(card, "مصرف شده"),
      0,
    )

    expect(
      sumAllocated,
      "sum of line allocations must equal the reported total",
    ).toBe(headerAllocated)
    expect(sumConsumed).toBe(headerConsumed)

    for (const card of cards) {
      const allocated = metricValue(card, "تخصیص")
      const consumed = metricValue(card, "مصرف شده")
      const remaining = metricValue(card, "باقی‌مانده")
      expect(remaining).toBe(allocated - consumed)
    }
  })

  test("the budget report shows a utilisation rate per line", async ({ page }) => {
    const text = await openPage(page, "/unit-head/finance/budget-reports")

    expect(text).toContain("نرخ مصرف")
    expect(metricValue(text, "بودجه کل")).toBeGreaterThan(0)

    // Every utilisation percentage must be within 0–100 (or 100+ only when the
    // line is genuinely overspent, which the seed data is not).
    const rates = Array.from(text.matchAll(/نرخ مصرف\s*([\d۰-۹]+)[٪%]/g)).map((match) =>
      faNumber(match[1]),
    )

    expect(rates.length).toBeGreaterThan(0)
    for (const rate of rates) {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(100)
    }
  })

  test("the fiscal year list is not empty for the finance unit", async ({ page }) => {
    const text = await openPage(page, "/unit-head/finance/fiscal-years")

    // The organisation has a fiscal year; the finance unit must see it.
    expect(
      metricValue(text, "کل سال‌های مالی"),
      "the finance unit cannot see its organisation's fiscal years",
    ).toBeGreaterThan(0)
  })

  test("payment orders show the empty state when nothing was sent", async ({
    page,
  }) => {
    const text = await openPage(page, "/unit-head/finance/payment-orders")

    const sent = metricValue(text, "دستورات پرداخت (این صفحه)")
    if (sent === 0) {
      expect(text).toContain("دستور پرداختی یافت نشد")
    }
  })
})
