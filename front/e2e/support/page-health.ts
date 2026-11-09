import { expect, type Page } from "@playwright/test"

/**
 * Shared health checks so every spec fails loudly when a page crashes instead
 * of silently asserting on a half-rendered DOM.
 *
 * Catches three classes of regressions:
 *   1. Uncaught exceptions in the browser (`pageerror`).
 *   2. A React/Next error boundary rendering ("تلاش مجدد" / "خطای سیستمی").
 *   3. Console errors that indicate a broken render (hydration, undefined access).
 */

/** Console noise that is expected in a Next.js dev server. */
const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /\[HMR\]/i,
  /favicon\.ico/i,
  /net::ERR_ABORTED/i,
  /net::ERR_EMPTY_RESPONSE/i,
  /ResizeObserver loop/i,
]

/** Console errors that always mean a real defect. */
const FATAL_CONSOLE_PATTERNS: RegExp[] = [
  /Hydration failed/i,
  /Text content does not match/i,
  /Cannot read propert/i,
  /Cannot destructure propert/i,
  /is not a function/i,
  /Unhandled Runtime Error/i,
  /Minified React error/i,
  /An unexpected response was received from the server/i,
]

/** Copy rendered by the app's `error.tsx` boundaries. */
export const ERROR_BOUNDARY_TEXT = "تلاش مجدد"

export interface PageHealth {
  consoleErrors: string[]
  pageErrors: string[]
  stop: () => void
}

export function watchPageHealth(page: Page): PageHealth {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() !== "error") return

    const text = message.text()
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return

    consoleErrors.push(text)
  }

  const onPageError = (error: Error) => {
    pageErrors.push(`${error.name}: ${error.message}`)
  }

  page.on("console", onConsole)
  page.on("pageerror", onPageError)

  return {
    consoleErrors,
    pageErrors,
    stop: () => {
      page.off("console", onConsole)
      page.off("pageerror", onPageError)
    },
  }
}

/**
 * Asserts the page under test did not crash. `context` shows up in the failure
 * message so a crawl over many routes points straight at the broken one.
 */
export async function expectHealthyPage(
  page: Page,
  health: PageHealth,
  context: string,
): Promise<void> {
  await expect(
    page.getByRole("button", { name: ERROR_BOUNDARY_TEXT, exact: true }),
    `${context}: an error boundary rendered instead of the page`,
  ).toHaveCount(0)

  expect(
    health.pageErrors,
    `${context}: uncaught browser exceptions`,
  ).toEqual([])

  const fatal = health.consoleErrors.filter((text) =>
    FATAL_CONSOLE_PATTERNS.some((pattern) => pattern.test(text)),
  )

  expect(fatal, `${context}: fatal console errors`).toEqual([])
}

/** Resets the collected errors so one check can cover one navigation. */
export function resetHealth(health: PageHealth): void {
  health.consoleErrors.length = 0
  health.pageErrors.length = 0
}

/**
 * Client-rendered pages fetch their data in `useEffect`, so `<main>` shows KPI
 * cards (with zeroes) long before the list arrives. This waits for the text to
 * stop changing AND for every in-page spinner to disappear, which is what the
 * pages render while a request is in flight.
 */
export async function waitForStableMain(
  page: Page,
  timeout = 45_000,
): Promise<string> {
  const deadline = Date.now() + timeout
  let previous = ""
  let stableReads = 0

  while (Date.now() < deadline) {
    const text = (await page
      .getByRole("main")
      .innerText()
      .catch(() => "")).trim()

    const spinners = await page
      .locator('main [class*="animate-spin"]')
      .count()
      .catch(() => 0)

    if (text.length > 0 && spinners === 0 && text === previous) {
      stableReads += 1
      if (stableReads >= 2) return text
    } else {
      stableReads = 0
    }

    previous = text
    await page.waitForTimeout(250)
  }

  return previous
}

/**
 * Server components stream in behind `loading.tsx` skeletons, so `<main>` can
 * exist while still being empty. Poll until it has text before asserting on it.
 */
export async function waitForMainText(
  page: Page,
  timeout = 30_000,
): Promise<string> {
  const deadline = Date.now() + timeout
  let text = ""

  while (Date.now() < deadline) {
    text = (await page
      .getByRole("main")
      .innerText()
      .catch(() => "")).trim()

    if (text.length > 0) return text

    await page.waitForTimeout(300)
  }

  return text
}
