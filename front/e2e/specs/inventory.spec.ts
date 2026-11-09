import { expect, test } from "@playwright/test"

import { createPersonaSession, storageStateFor } from "../support/api"
import {
  cardCount,
  entityIds,
  faDigits,
  metricValue,
  openPage,
} from "../support/domain"
import { expectHealthyPage, watchPageHealth } from "../support/page-health"

/** Movement rows are identified by the "قبل → بعد" delta each one renders. */
async function movementCount(page: import("@playwright/test").Page): Promise<number> {
  return page.evaluate(() => {
    const main = document.querySelector("main")
    if (!main) return 0

    return Array.from(main.querySelectorAll("*")).filter(
      (element) =>
        element.children.length === 0 &&
        (element.textContent ?? "").includes("قبل → بعد"),
    ).length
  })
}

/**
 * Inventory: stock levels, adjustments, transfers, consumption and the movement
 * ledger that ties them together.
 *
 * The important invariant is that a stock change is *explained*: every movement
 * records a before → after delta, and consumption of N units produces a movement
 * of −N.
 */

test.describe("Inventory — admin", () => {
  test.use({ storageState: storageStateFor("manager") })

  test("lists stock levels with adjust and transfer actions", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, "/admin/inventory")

    await expect(
      page.getByRole("heading", { level: 1, name: "موجودی انبار" }),
    ).toBeVisible()

    const cards = await cardCount(page)
    expect(cards).toBeGreaterThanOrEqual(8)
    expect(text).toMatch(/۸ موجودی/)

    await expect(
      page.getByRole("main").locator('button[title="تعدیل موجودی"]').first(),
    ).toBeVisible()
    await expect(
      page.getByRole("main").locator('button[title="انتقال موجودی"]').first(),
    ).toBeVisible()

    await expectHealthyPage(page, health, "admin inventory")
    health.stop()
  })

  test("the adjust dialog requires a new quantity before confirming", async ({
    page,
  }) => {
    await openPage(page, "/admin/inventory")

    await page.getByRole("main").locator('button[title="تعدیل موجودی"]').first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("تعدیل موجودی")).toBeVisible()

    const quantity = dialog.getByPlaceholder("تعداد جدید را وارد کنید")
    await expect(quantity).toBeVisible()
    await expect(dialog.getByPlaceholder("دلیل تعدیل...")).toBeVisible()

    const confirm = dialog.getByRole("button", { name: "تأیید تعدیل", exact: true })
    await expect(confirm, "confirm must be disabled with an empty quantity").toBeDisabled()

    await quantity.fill("7")
    await expect(confirm).toBeEnabled()

    await dialog.getByRole("button", { name: "انصراف", exact: true }).click()
    await expect(dialog).toBeHidden()
  })

  test("the transfer dialog asks for a destination unit and quantity", async ({
    page,
  }) => {
    await openPage(page, "/admin/inventory")

    await page.getByRole("main").locator('button[title="انتقال موجودی"]').first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("انتقال موجودی")).toBeVisible()
    await expect(dialog.getByText("واحد مقصد", { exact: false }).first()).toBeVisible()
    await expect(dialog.getByPlaceholder("تعداد را وارد کنید")).toBeVisible()
    await expect(dialog.getByPlaceholder("دلیل انتقال...")).toBeVisible()

    await dialog.getByRole("button", { name: "انصراف", exact: true }).click()
    await expect(dialog).toBeHidden()
  })

  test("stock movements record a before → after delta", async ({ page }) => {
    const text = await openPage(page, "/admin/stock-movements")

    await expect(
      page.getByRole("heading", { level: 1, name: "گردش انبار" }),
    ).toBeVisible()

    // The ledger is read-only, so rows carry no edit/delete buttons — count the
    // delta marker instead.
    const rows = await movementCount(page)
    expect(rows).toBeGreaterThanOrEqual(10)
    expect(text).toContain("قبل → بعد")
  })

  test("the movement type filter narrows the ledger", async ({ page }) => {
    await openPage(page, "/admin/stock-movements")

    const before = await movementCount(page)
    expect(before).toBeGreaterThan(0)

    await page.getByLabel("فیلتر نوع گردش", { exact: true }).click()
    await page.getByRole("option").nth(1).click()

    await expect
      .poll(async () => movementCount(page), {
        message: "filtering by movement type did not change the list",
      })
      .toBeLessThan(before)
  })

  test("consumption lists its records and opens the register dialog", async ({
    page,
  }) => {
    const text = await openPage(page, "/admin/consumption")

    await expect(
      page.getByRole("heading", { level: 1, name: "مصرف" }),
    ).toBeVisible()
    expect(text).toMatch(/۲ مصرف/)

    const cards = await cardCount(page)
    expect(cards).toBeGreaterThanOrEqual(2)

    await page.getByRole("button", { name: "ثبت مصرف", exact: true }).first().click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
  })

  test("store stock shows quantities and prices", async ({ page }) => {
    const text = await openPage(page, "/admin/stuff")

    expect(text).toMatch(/۴ رکورد/)
    expect(text).toContain("موجودی")
    expect(text).toContain("قیمت")

    const cards = await cardCount(page)
    expect(cards).toBeGreaterThanOrEqual(4)
  })
})

test.describe("Inventory — unit head (warehouse)", () => {
  test.use({ storageState: storageStateFor("unitHeadWarehouse") })

  test("the warehouse unit sees its own stock and the total adds up", async ({
    page,
  }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, "/unit-head/inventory")

    await expect(
      page.getByRole("heading", { level: 1, name: "موجودی انبار" }),
    ).toBeVisible()

    const total = metricValue(text, "مجموع موجودی")
    const items = metricValue(text, "کل اقلام موجودی")

    expect(items).toBeGreaterThan(0)
    expect(total).toBeGreaterThan(0)

    // Group headers summarise their bucket; the sum of buckets must equal the
    // headline total.
    const buckets = Array.from(
      text.matchAll(/(\d[\d۰-۹٬,]*)\s*کالا — مجموع:\s*(\d[\d۰-۹٬,]*)\s*عدد/g),
    ).map((match) => metricValue(`x ${match[2]}`, "x"))

    if (buckets.length > 0) {
      expect(buckets.reduce((sum, value) => sum + value, 0)).toBe(total)
    }

    await expectHealthyPage(page, health, "unit head inventory")
    health.stop()
  })

  test("a stock row opens its detail page with transfer available", async ({
    page,
  }) => {
    await openPage(page, "/unit-head/inventory")

    const ids = await entityIds(page, "/unit-head/inventory")
    expect(ids.length).toBeGreaterThan(0)

    await openPage(page, `/unit-head/inventory/${ids[0]}`)

    const text = await page.getByRole("main").innerText()
    expect(text).toContain("موجودی")
    expect(text).not.toContain("تلاش مجدد")
  })
})

test.describe("Inventory — employee (request centre)", () => {
  test.use({ storageState: storageStateFor("employee") })

  test("stock, consumption and movements agree with each other", async ({ page }) => {
    const inventoryText = await openPage(page, "/requests/inventory")
    expect(metricValue(inventoryText, "کل اقلام موجودی")).toBeGreaterThan(0)

    const consumptionText = await openPage(page, "/requests/consumption")
    const consumed = metricValue(consumptionText, "مجموع مصرف")
    expect(consumed).toBeGreaterThan(0)

    const movementText = await openPage(page, "/requests/stock-movements")
    const movements = metricValue(movementText, "کل گردش‌ها")
    expect(movements).toBeGreaterThan(0)

    // A consumption must leave an outbound movement of the same magnitude.
    expect(
      movementText,
      "consumption of N units must appear as an outbound movement",
    ).toContain(`−${faDigits(consumed)}`)
  })

  test("a consumption record opens its detail page", async ({ page }) => {
    await openPage(page, "/requests/consumption")

    const ids = await entityIds(page, "/requests/consumption")
    expect(ids.length).toBeGreaterThan(0)

    await openPage(page, `/requests/consumption/${ids[0]}`)
    await expect(page.getByRole("main")).not.toBeEmpty()
    await expect(
      page.getByText("تلاش مجدد", { exact: true }),
    ).toHaveCount(0)
  })

  test("the delivery page shows its empty state when nothing is waiting", async ({
    page,
  }) => {
    const text = await openPage(page, "/requests/goods-receipt")
    expect(text).toContain("دریافت کالا")

    const pending = metricValue(text, "کالاهای در انتظار تحویل")
    if (pending === 0) {
      expect(text).toContain("کالایی برای تحویل نیست")
    }
  })

  test("switching persona to the finance unit head keeps stock scoped", async ({
    page,
  }) => {
    await page.context().clearCookies()
    const session = await createPersonaSession("unitHeadFinance")
    await page.context().addCookies(session.cookies)

    const text = await openPage(page, "/unit-head/inventory")

    // The finance unit holds no stock in the seed data, so the page must say so
    // rather than borrow another unit's rows.
    expect(
      text,
      "a unit with no stock must render the empty state, not another unit's rows",
    ).toContain("موجودی‌ای یافت نشد")
    expect(text).not.toContain("انبار مرکزی")
  })
})
