import { expect, test } from "@playwright/test"
import { endOfMonth, startOfMonth } from "date-fns-jalali"

import { createPersonaSession, storageStateFor } from "../support/api"
import {
  faNumber,
  metricValue,
  openPage,
  tableByHeaders,
} from "../support/domain"
import { expectHealthyPage, waitForStableMain, watchPageHealth } from "../support/page-health"

/**
 * Accounting: chart of accounts, journal entries, periods, cost centres and the
 * three reports.
 *
 * The invariants here are the ones that silently break the books:
 *   - every journal entry balances (debit === credit)
 *   - the trial balance as a whole balances
 *   - report totals agree with the lines they summarise
 *   - the date quick-ranges follow the *Jalali* calendar, like the rest of the UI
 */

test.use({ storageState: storageStateFor("manager") })

const BASE = "/admin/accounting"

test.describe("Accounting — dashboard", () => {
  test("renders the month's figures and the organisation scope", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, `${BASE}`)

    await expect(
      page.getByRole("heading", { level: 1, name: "داشبورد حسابداری" }),
    ).toBeVisible()

    for (const label of [
      "جمع بدهکار (این ماه)",
      "جمع بستانکار (این ماه)",
      "سود / زیان خالص",
      "اسناد ثبت‌شده",
      "دوره‌های باز",
    ]) {
      expect(text, `dashboard is missing "${label}"`).toContain(label)
    }

    // The active organisation must be named, not blank.
    expect(text).toContain("سازمان آلفا")

    await expectHealthyPage(page, health, "accounting dashboard")
    health.stop()
  })
})

test.describe("Accounting — chart of accounts", () => {
  test("renders the seeded accounts with the expected columns", async ({ page }) => {
    const text = await openPage(page, `${BASE}/accounts`)

    await expect(
      page.getByRole("heading", { level: 1, name: "کدینگ حساب‌ها" }),
    ).toBeVisible()

    const { headers, rows } = await tableByHeaders(page, [
      "کد",
      "نام حساب",
      "ماهیت",
      "وضعیت",
    ])
    expect(headers).toEqual([
      "کد",
      "نام حساب",
      "نوع",
      "ماهیت",
      "سطح",
      "وضعیت",
      "عملیات",
    ])

    // Group header rows ("دارایی", …) have no code cell; account rows do.
    const accountRows = rows.filter((cells) => /^\d{3,}$/.test(cells[0] ?? ""))
    expect(accountRows.length).toBe(17)

    // The header badge must agree with what is on screen.
    const badge = /(\d[\d٬,]*)\s*حساب/.exec(
      text.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))),
    )
    expect(badge, "accounts page has no count badge").toBeTruthy()
    expect(faNumber(badge![1])).toBe(accountRows.length)

    // Every account row must show a normal balance and a status.
    for (const cells of accountRows) {
      expect(["بدهکار", "بستانکار"]).toContain(cells[3])
      expect(cells[5]).toMatch(/فعال|غیرفعال/)
    }
  })

  test("searching by account code narrows the tree", async ({ page }) => {
    await openPage(page, `${BASE}/accounts`)

    const search = page.getByLabel("جستجوی کد یا نام حساب…", { exact: true })
    await expect(search).toBeVisible()
    await search.fill("1010")
    await search.press("Enter")

    await expect.poll(() => page.url()).toContain("search=1010")

    const { rows } = await tableByHeaders(page, ["کد", "نام حساب"])
    const codes = rows.map((cells) => cells[0]).filter((code) => /^\d{3,}$/.test(code ?? ""))
    expect(codes.length).toBeGreaterThanOrEqual(1)
    expect(codes.every((code) => code.includes("1010"))).toBe(true)
  })
})

test.describe("Accounting — journal entries", () => {
  test("every entry in the list is balanced", async ({ page }) => {
    const health = watchPageHealth(page)
    await openPage(page, `${BASE}/journal-entries`)

    const { headers, rows } = await tableByHeaders(page, [
      "شماره سند",
      "بدهکار",
      "بستانکار",
    ])
    const debitIndex = headers.indexOf("بدهکار")
    const creditIndex = headers.indexOf("بستانکار")
    const balanceIndex = headers.indexOf("تراز")
    expect(debitIndex).toBeGreaterThan(-1)
    expect(creditIndex).toBeGreaterThan(-1)

    expect(rows.length).toBeGreaterThan(0)

    for (const cells of rows) {
      const debit = faNumber((cells[debitIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0")
      const credit = faNumber((cells[creditIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0")

      expect(
        debit,
        `entry ${cells[0]} does not balance: debit ${debit} vs credit ${credit}`,
      ).toBe(credit)

      if (balanceIndex > -1) {
        expect(
          cells[balanceIndex],
          `entry ${cells[0]} is flagged as unbalanced`,
        ).not.toContain("نامتوازن")
      }
    }

    await expectHealthyPage(page, health, "journal entries")
    health.stop()
  })

  test("an entry's detail totals equal the sum of its lines", async ({ page }) => {
    const health = watchPageHealth(page)
    await openPage(page, `${BASE}/journal-entries`)

    await page.getByRole("main").locator("table tbody tr a").first().click()
    await expect.poll(() => page.url()).toMatch(/journal-entries\/[a-f0-9]{24}/)

    const text = await waitForStableMain(page)
    const headerDebit = metricValue(text, "جمع بدهکار")
    const headerCredit = metricValue(text, "جمع بستانکار")

    expect(headerDebit).toBe(headerCredit)
    expect(headerDebit).toBeGreaterThan(0)

    const { headers, rows } = await tableByHeaders(page, [
      "حساب",
      "بدهکار",
      "بستانکار",
    ])
    const debitIndex = headers.indexOf("بدهکار")
    const creditIndex = headers.indexOf("بستانکار")
    expect(debitIndex).toBeGreaterThan(-1)

    const lineDebit = rows.reduce(
      (total, cells) =>
        total + faNumber((cells[debitIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0"),
      0,
    )
    const lineCredit = rows.reduce(
      (total, cells) =>
        total + faNumber((cells[creditIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0"),
      0,
    )

    expect(lineDebit, "sum of debit lines must equal the header total").toBe(headerDebit)
    expect(lineCredit, "sum of credit lines must equal the header total").toBe(headerCredit)

    await expectHealthyPage(page, health, "journal entry detail")
    health.stop()
  })
})

test.describe("Accounting — reports", () => {
  test("the trial balance balances", async ({ page }) => {
    const health = watchPageHealth(page)
    const text = await openPage(page, `${BASE}/reports/trial-balance`)

    await expect(
      page.getByRole("heading", { level: 1, name: "تراز آزمایشی" }),
    ).toBeVisible()
    expect(text).toContain("تراز آزمایشی متوازن است")

    const table = await page.evaluate(() => {
      const element = document.querySelector("main table")
      if (!element) return { headers: [] as string[], rows: [] as string[][], footer: [] as string[] }

      return {
        headers: Array.from(element.querySelectorAll("thead th")).map(
          (cell) => cell.textContent?.trim() ?? "",
        ),
        rows: Array.from(element.querySelectorAll("tbody tr")).map((row) =>
          Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent?.trim() ?? ""),
        ),
        footer: Array.from(element.querySelectorAll("tfoot td")).map(
          (cell) => cell.textContent?.trim() ?? "",
        ),
      }
    })

    const debitIndex = table.headers.indexOf("بدهکار")
    const creditIndex = table.headers.indexOf("بستانکار")
    expect(debitIndex).toBeGreaterThan(-1)
    expect(creditIndex).toBeGreaterThan(-1)

    // The footer carries the grand total: "جمع کل" followed by debit, credit, balance.
    expect(table.footer[0]).toBe("جمع کل")

    const totalDebit = faNumber(table.footer[1].replace(/[^\d۰-۹٬,]/g, ""))
    const totalCredit = faNumber(table.footer[2].replace(/[^\d۰-۹٬,]/g, ""))

    expect(totalDebit).toBeGreaterThan(0)
    expect(totalDebit, "grand total must have equal debit and credit").toBe(totalCredit)

    // Leaf account rows must add up to the grand total — subtotal rows
    // ("جمع دارایی") are excluded so nothing is counted twice.
    const leafRows = table.rows.filter((cells) => /^\d{3,}$/.test(cells[0] ?? ""))
    expect(leafRows.length).toBeGreaterThan(0)

    const leafDebit = leafRows.reduce(
      (total, cells) =>
        total + faNumber((cells[debitIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0"),
      0,
    )
    const leafCredit = leafRows.reduce(
      (total, cells) =>
        total + faNumber((cells[creditIndex] ?? "0").replace(/[^\d۰-۹٬,]/g, "") || "0"),
      0,
    )

    expect(leafDebit, "sum of account debits must equal the grand total").toBe(totalDebit)
    expect(leafCredit, "sum of account credits must equal the grand total").toBe(
      totalCredit,
    )

    await expectHealthyPage(page, health, "trial balance")
    health.stop()
  })

  test("the quick ranges use the Jalali month, not the Gregorian one", async ({
    page,
  }) => {
    await openPage(page, `${BASE}/reports/trial-balance`)

    await page.getByRole("button", { name: "این ماه", exact: true }).click()

    await expect
      .poll(
        () => new URL(page.url()).searchParams.get("startDate"),
        { message: "«این ماه» did not set a date range" },
      )
      .toBeTruthy()

    const startParam = new URL(page.url()).searchParams.get("startDate")
    const endParam = new URL(page.url()).searchParams.get("endDate")
    expect(endParam).toBeTruthy()

    // The whole product is Jalali (fiscal years, periods, date pickers), so the
    // shortcut must resolve to the current Jalali month.
    const expectedStart = startOfMonth(new Date())
    const expectedEnd = endOfMonth(new Date())
    const actualStart = new Date(startParam as string)
    const actualEnd = new Date(endParam as string)

    expect(
      [
        actualStart.getUTCFullYear(),
        actualStart.getUTCMonth(),
        actualStart.getUTCDate(),
      ],
      `«این ماه» resolved to ${actualStart.toISOString()} but the Jalali month starts on ` +
        `${expectedStart.getFullYear()}-${expectedStart.getMonth() + 1}-${expectedStart.getDate()}`,
    ).toEqual([
      expectedStart.getFullYear(),
      expectedStart.getMonth(),
      expectedStart.getDate(),
    ])

    expect([
      actualEnd.getUTCFullYear(),
      actualEnd.getUTCMonth(),
      actualEnd.getUTCDate(),
    ]).toEqual([
      expectedEnd.getFullYear(),
      expectedEnd.getMonth(),
      expectedEnd.getDate(),
    ])
  })

  test("the general ledger renders lines once an account is chosen", async ({
    page,
  }) => {
    const text = await openPage(page, `${BASE}/reports/general-ledger`)
    expect(text).toContain("حسابی انتخاب نشده است")

    await page.getByLabel("انتخاب حساب", { exact: true }).click()
    await page.getByRole("option").first().click()

    await expect
      .poll(() => page.url(), { message: "account selection did not persist" })
      .toContain("accountId=")

    // Either ledger lines or an explicit "no movement" message — never the
    // "select an account" prompt.
    const settled = await waitForStableMain(page)
    expect(settled).not.toContain("حسابی انتخاب نشده است")
  })

  test("the income statement splits revenue from expenses", async ({ page }) => {
    const text = await openPage(page, `${BASE}/reports/income-statement`)

    await expect(
      page.getByRole("heading", { level: 1, name: "صورت سود و زیان" }),
    ).toBeVisible()

    expect(text).toContain("درآمدها")
    expect(text).toContain("هزینه‌ها")
    expect(text).toMatch(/سود|زیان/)
  })

  test("periods and cost centres render their tables", async ({ page }) => {
    await openPage(page, `${BASE}/periods`)
    const periods = await tableByHeaders(page, ["کد", "وضعیت"])
    expect(periods.headers).toContain("کد")
    expect(periods.headers).toContain("وضعیت")
    expect(periods.rows.length).toBeGreaterThanOrEqual(2)

    await openPage(page, `${BASE}/cost-centers`)
    const centres = await tableByHeaders(page, ["مسئول", "وضعیت"])
    expect(centres.headers).toContain("مسئول")
    expect(centres.rows.length).toBeGreaterThanOrEqual(4)
  })
})

test.describe("Accounting — access control", () => {
  test("a non-finance unit head is denied the accounting section", async ({
    page,
  }) => {
    await page.context().clearCookies()
    const session = await createPersonaSession("unitHeadWarehouse")
    await page.context().addCookies(session.cookies)

    const text = await openPage(page, "/unit-head/finance/accounting")

    expect(text).toContain("دسترسی به حسابداری مجاز نیست")
    expect(text).not.toContain("کدینگ حساب‌ها")
  })

  test("the finance unit head sees the same chart of accounts as the admin", async ({
    page,
  }) => {
    await page.context().clearCookies()
    const session = await createPersonaSession("unitHeadFinance")
    await page.context().addCookies(session.cookies)

    await openPage(page, "/unit-head/finance/accounting/accounts")

    const { rows } = await tableByHeaders(page, ["کد", "نام حساب"])
    const accountRows = rows.filter((cells) => /^\d{3,}$/.test(cells[0] ?? ""))

    expect(accountRows.length).toBe(17)
  })
})
