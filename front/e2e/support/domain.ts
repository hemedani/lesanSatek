import { expect, type Page } from "@playwright/test"

import { waitForStableMain } from "./page-health"

/**
 * Shared helpers for the domain suites (accounting, inventory, procurement,
 * budget, admin master data).
 *
 * These pages are a mix of server-rendered lists and client-fetched dashboards,
 * so every helper settles the page first instead of snapshotting mid-hydration.
 */

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

/** 12 → "۱۲" so Persian-rendered counts can be matched in assertions. */
export function faDigits(value: number): string {
  return value.toLocaleString("fa-IR")
}

/** "۳۸۴٬۸۰۰٬۰۰۰" → 384800000 */
export function faNumber(text: string): number {
  const normalized = text
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٬,٫\s]/g, "")

  const value = Number(normalized)
  if (!Number.isFinite(value)) {
    throw new Error(`Not a Persian number: "${text}"`)
  }
  return value
}

/**
 * Reads the number rendered after `label` in flattened page text, e.g.
 * `بودجه کل ۳۸۴٬۸۰۰٬۰۰۰ ریال` → metricValue(text, "بودجه کل") === 384800000.
 */
export function metricValue(text: string, label: string): number {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = new RegExp(`${escaped}\\s*([\\d۰-۹][\\d۰-۹٬,٫]*)`).exec(text)

  if (!match) {
    throw new Error(
      `metric "${label}" not found in page text:\n${text.slice(0, 400)}`,
    )
  }
  return faNumber(match[1])
}

/** Navigates and waits until the page has finished its client-side fetches. */
export async function openPage(page: Page, path: string): Promise<string> {
  await page.goto(path, { waitUntil: "domcontentloaded" })
  return waitForStableMain(page)
}

/**
 * Unique entity ids linked under `basePath`, ignoring sub-routes such as
 * `/edit`, `/relations`, `/graph` and `/steps`.
 */
export async function entityIds(page: Page, basePath: string): Promise<string[]> {
  return page.evaluate((base) => {
    const pattern = new RegExp(`^${base}/([a-f0-9]{24})(?:/|$)`)
    const ids = new Set<string>()

    document.querySelectorAll(`main a[href^="${base}/"]`).forEach((anchor) => {
      const href = anchor.getAttribute("href") ?? ""
      const match = pattern.exec(href)
      if (match) ids.add(match[1])
    })

    return Array.from(ids)
  }, basePath)
}

/** Counts rendered cards that carry no link (edit/delete-only card lists). */
export async function cardCount(page: Page): Promise<number> {
  return page
    .getByRole("main")
    .locator('button[title="حذف"], button[title="ویرایش"]')
    .count()
}

/**
 * Opens the first detail page reachable from a list route and returns its href.
 * Fails loudly when the list renders no matching link, because that usually
 * means the list is broken rather than that the test needs adjusting.
 */
export async function openFirstDetail(
  page: Page,
  listPath: string,
  hrefPattern: RegExp,
): Promise<string> {
  await openPage(page, listPath)

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main a[href]")).map(
      (anchor) => anchor.getAttribute("href") ?? "",
    ),
  )

  const target = hrefs.find((href) => hrefPattern.test(href))
  expect(
    target,
    `${listPath} rendered no link matching ${hrefPattern}`,
  ).toBeTruthy()

  await openPage(page, target as string)
  return target as string
}

/** All body rows of the first table on the page, as arrays of cell text. */
export async function tableRows(page: Page): Promise<string[][]> {
  return page.evaluate(() => {
    const table = document.querySelector("main table")
    if (!table) return []

    return Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).map(
        (cell) => cell.textContent?.trim() ?? "",
      ),
    )
  })
}

/** Table header labels of the first table on the page. */
export async function tableHeaders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const table = document.querySelector("main table")
    if (!table) return []

    return Array.from(table.querySelectorAll("thead th")).map(
      (cell) => cell.textContent?.trim() ?? "",
    )
  })
}

/**
 * Finds the table whose header contains every one of `requiredHeaders`.
 *
 * Report pages can render more than one table (a summary plus the detail), so
 * picking "the first table" is not reliable — match on the columns instead.
 */
export async function tableByHeaders(
  page: Page,
  requiredHeaders: string[],
): Promise<{ headers: string[]; rows: string[][] }> {
  return page.evaluate((required) => {
    const tables = Array.from(document.querySelectorAll("main table"))

    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (cell) => cell.textContent?.trim() ?? "",
      )
      if (!required.every((header) => headers.includes(header))) continue

      const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
        Array.from(row.querySelectorAll("td")).map(
          (cell) => cell.textContent?.trim() ?? "",
        ),
      )

      return { headers, rows }
    }

    return { headers: [], rows: [] }
  }, requiredHeaders)
}

/** Visible empty-state title, or "" when the page rendered content instead. */
export async function emptyStateTitle(page: Page): Promise<string> {
  const heading = page.getByRole("main").locator("h3").first()
  if ((await heading.count()) === 0) return ""
  return (await heading.textContent())?.trim() ?? ""
}

/** Opens a dialog by its trigger label and returns the dialog locator. */
export async function openDialog(page: Page, trigger: string) {
  await page.getByRole("button", { name: trigger, exact: true }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  return dialog
}
