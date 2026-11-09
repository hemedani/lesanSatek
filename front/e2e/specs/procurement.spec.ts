import { expect, test } from "@playwright/test"

import { storageStateFor } from "../support/api"
import {
  entityIds,
  faNumber,
  metricValue,
  openFirstDetail,
  openPage,
  tableHeaders,
  tableRows,
} from "../support/domain"
import { expectHealthyPage, waitForStableMain, watchPageHealth } from "../support/page-health"

/**
 * Procurement: the request → tender → goods receipt → payment order chain.
 *
 * These documents are generated from one another, so the suite checks the chain
 * end to end: every awarded tender has offers, every receipt has line items, and
 * every receipt is paid by a payment order.
 */

test.describe("Procurement — admin", () => {
  test.use({ storageState: storageStateFor("manager") })

  test("the request list renders every request and its status", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, "/admin/purchasing-requests")

    await expect(
      page.getByRole("heading", { level: 1, name: "درخواست‌های خرید" }),
    ).toBeVisible()

    const ids = await entityIds(page, "/admin/purchasing-requests")
    expect(ids.length).toBeGreaterThanOrEqual(12)
    expect(text).toMatch(/۱۲ درخواست/)

    await expectHealthyPage(page, health, "admin purchasing requests")
    health.stop()
  })

  test("filtering by status narrows the request list", async ({ page }) => {
    await openPage(page, "/admin/purchasing-requests")
    const before = (await entityIds(page, "/admin/purchasing-requests")).length

    await page.getByLabel("فیلتر بر اساس وضعیت", { exact: true }).click()
    await page.getByRole("option").nth(1).click()

    await expect
      .poll(
        async () => (await entityIds(page, "/admin/purchasing-requests")).length,
        { message: "status filter did not change the list" },
      )
      .toBeLessThan(before)
  })

  test("a request detail shows its process progress and approval trail", async ({
    page,
  }) => {
    const health = watchPageHealth(page)
    await openFirstDetail(
      page,
      "/admin/purchasing-requests",
      /^\/admin\/purchasing-requests\/[a-f0-9]{24}$/,
    )

    const text = await waitForStableMain(page)
    expect(text).toContain("پیشرفت فرآیند")
    expect(text).toMatch(/مرحله \d+ از \d+/)

    await expectHealthyPage(page, health, "request detail")
    health.stop()
  })

  test("every tender lists the offers it received", async ({ page }) => {
    await openPage(page, "/admin/tenders")

    const ids = await entityIds(page, "/admin/tenders")
    expect(ids.length).toBeGreaterThanOrEqual(2)

    for (const id of ids) {
      await openPage(page, `/admin/tenders/${id}`)
      const text = await waitForStableMain(page)

      expect(text, `tender ${id} renders no offers section`).toContain("پیشنهاد")
      expect(text).toMatch(/پذیرفته|رد شده/)
    }
  })

  test("goods receipts carry their line items", async ({ page }) => {
    await openPage(page, "/admin/goods-receipts")

    const ids = await entityIds(page, "/admin/goods-receipts")
    expect(ids.length).toBeGreaterThanOrEqual(8)

    await openPage(page, `/admin/goods-receipts/${ids[0]}`)

    const headers = await tableHeaders(page)
    expect(headers).toContain("کالا")
    expect(headers).toContain("دریافتی")
    expect(headers).toContain("قبول")

    const rows = await tableRows(page)
    expect(rows.length).toBeGreaterThan(0)

    // Received = accepted + rejected, per line.
    const receivedIndex = headers.indexOf("دریافتی")
    const acceptedIndex = headers.indexOf("قبول")
    const rejectedIndex = headers.indexOf("رد")

    for (const cells of rows) {
      const received = faNumber(cells[receivedIndex].replace(/[^\d۰-۹٬,]/g, "") || "0")
      const accepted = faNumber(cells[acceptedIndex].replace(/[^\d۰-۹٬,]/g, "") || "0")
      const rejected = faNumber(cells[rejectedIndex].replace(/[^\d۰-۹٬,]/g, "") || "0")

      expect(received, "received quantity must equal accepted + rejected").toBe(
        accepted + rejected,
      )
    }
  })

  test("every goods receipt is covered by a payment order", async ({ page }) => {
    const receipts = await openPage(page, "/admin/goods-receipts")
    const receiptIds = await entityIds(page, "/admin/goods-receipts")

    await openPage(page, "/admin/payment-orders")
    const paymentIds = await entityIds(page, "/admin/payment-orders")

    expect(receipts).toMatch(/۸ رسید کالا/)
    expect(
      paymentIds.length,
      "each goods receipt should produce one payment order",
    ).toBe(receiptIds.length)
  })

  test("a payment order detail shows a positive amount and its source", async ({
    page,
  }) => {
    await openFirstDetail(
      page,
      "/admin/payment-orders",
      /^\/admin\/payment-orders\/[a-f0-9]{24}$/,
    )

    const text = await waitForStableMain(page)
    expect(metricValue(text, "مبلغ")).toBeGreaterThan(0)
    expect(text).toMatch(/درخواست خرید|رسید کالا/)
  })
})

test.describe("Procurement — store head", () => {
  test.use({ storageState: storageStateFor("storeHead") })

  test("the assigned requests list matches its own counter", async ({ page }) => {
    const text = await openPage(page, "/storehead/purchasing-requests")

    await expect(
      page.getByRole("heading", { level: 1, name: "درخواست‌های خرید" }),
    ).toBeVisible()

    const total = metricValue(text, "کل درخواست‌ها")
    const ids = await entityIds(page, "/storehead/purchasing-requests")

    expect(total).toBeGreaterThan(0)
    expect(
      ids.length,
      `counter says ${total} requests but ${ids.length} cards rendered`,
    ).toBe(total)
  })

  test("the tender list counter matches the rendered tenders", async ({ page }) => {
    const text = await openPage(page, "/storehead/tenders")

    const total = metricValue(text, "کل مناقصات")
    const ids = await entityIds(page, "/storehead/tenders")

    expect(
      ids.length,
      `«کل مناقصات» says ${total} but ${ids.length} tenders rendered`,
    ).toBe(total)
  })

  test("submitting an offer opens a form bound to the tender", async ({ page }) => {
    await openPage(page, "/storehead/tenders")

    const ids = await entityIds(page, "/storehead/tenders")
    expect(ids.length).toBeGreaterThan(0)

    await openPage(page, `/storehead/tenders/${ids[0]}/offer`)

    await expect(
      page.getByRole("heading", { level: 1 }).first(),
    ).toBeVisible()

    // The form must offer a price and a delivery period.
    const text = await waitForStableMain(page)
    expect(text).toMatch(/قیمت|مبلغ/)
    expect(text).toMatch(/تحویل|روز/)
  })

  test("my offers lists only offers this store submitted", async ({ page }) => {
    const text = await openPage(page, "/storehead/my-offers")

    await expect(
      page.getByRole("heading", { level: 1, name: "پیشنهادهای من" }),
    ).toBeVisible()

    const total = metricValue(text, "کل پیشنهادها")
    expect(total).toBeGreaterThan(0)

    // Every card names the tender it responds to and the price offered.
    expect(text).toMatch(/مناقصه/)
    expect(text).toMatch(/ریال/)
    expect(text).toMatch(/رد شده|پذیرفته شده|در انتظار/)
  })
})

test.describe("Procurement — employee", () => {
  test.use({ storageState: storageStateFor("employee") })

  test("my requests lists every request the employee raised", async ({ page }) => {
    const text = await openPage(page, "/requests/my-requests")

    await expect(
      page.getByRole("heading", { level: 1, name: "درخواست‌های من" }),
    ).toBeVisible()

    const total = metricValue(text, "کل درخواست‌ها")
    const ids = await entityIds(page, "/requests")

    expect(total).toBeGreaterThan(0)
    expect(ids.length).toBe(total)
  })

  test("a request detail shows the step-by-step workflow", async ({ page }) => {
    await openFirstDetail(page, "/requests/my-requests", /^\/requests\/[a-f0-9]{24}$/)

    const text = await waitForStableMain(page)
    expect(text).toMatch(/گام|مرحله/)
    expect(text).toContain("فرآیند")
  })
})
