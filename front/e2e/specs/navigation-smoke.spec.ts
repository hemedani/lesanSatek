import { expect, test, type Page } from "@playwright/test"

import { storageStateFor } from "../support/api"
import { PERSONAS, type PersonaKey } from "../support/personas"
import { watchPageHealth, resetHealth } from "../support/page-health"

/**
 * Breadth coverage: sign in as each persona, read the routes out of the
 * rendered sidebar, then open every one of them and assert it renders.
 *
 * This is the safety net for "we break something whenever we add a feature":
 * a new nav entry is crawled automatically, and a crashed route fails with the
 * offending path plus the collected browser errors.
 */

const CRAWL_PERSONAS: PersonaKey[] = [
  "manager",
  "orgHead",
  "unitHeadWarehouse",
  "storeHead",
  "employee",
]

/** Per-route budget — a single dev-server compile can take a few seconds. */
const ROUTE_TIMEOUT = 90_000

/**
 * Server components stream in behind a `loading.tsx` skeleton, so `<main>` can
 * exist while still being empty. Poll until it has text before judging the page.
 */
async function waitForMainText(
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

async function collectSidebarRoutes(page: Page): Promise<string[]> {
  const links = page.locator('nav[aria-label="ناوبری اصلی"] a[href^="/"]')
  const count = await links.count()
  const hrefs: string[] = []

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute("href")
    if (href && !href.startsWith("//")) hrefs.push(href)
  }

  return [...new Set(hrefs)]
}

for (const key of CRAWL_PERSONAS) {
  const persona = PERSONAS[key]

  test.describe(`Route crawl — ${persona.label}`, () => {
    test.use({ storageState: storageStateFor(key) })

    test("every sidebar route renders without crashing", async ({ page }) => {
      test.setTimeout(15 * 60_000)

      const health = watchPageHealth(page)

      await page.goto(persona.homePath, { waitUntil: "domcontentloaded" })
      await expect(page.getByRole("main")).toBeVisible({ timeout: ROUTE_TIMEOUT })

      const routes = await collectSidebarRoutes(page)

      expect(
        routes.length,
        `${persona.label} should expose sidebar navigation`,
      ).toBeGreaterThan(1)

      const failures: string[] = []

      for (const href of routes) {
        resetHealth(health)

        let status = 0

        try {
          const response = await page.goto(href, {
            waitUntil: "domcontentloaded",
            timeout: ROUTE_TIMEOUT,
          })
          status = response?.status() ?? 0

          // Let client components hydrate so client-side crashes surface.
          await page
            .getByRole("main")
            .waitFor({ state: "visible", timeout: ROUTE_TIMEOUT })
          await page
            .waitForLoadState("networkidle", { timeout: 15_000 })
            .catch(() => undefined)
        } catch (error) {
          failures.push(
            `${href} → navigation failed: ${
              error instanceof Error ? error.message.split("\n")[0] : String(error)
            }`,
          )
          continue
        }

        const pathname = new URL(page.url()).pathname
        const problems: string[] = []

        if (status >= 400) problems.push(`HTTP ${status}`)
        if (pathname !== href) problems.push(`redirected to ${pathname}`)

        const errorBoundary = await page
          .getByRole("button", { name: "تلاش مجدد", exact: true })
          .count()

        if (errorBoundary > 0) problems.push("error boundary rendered")

        if (health.pageErrors.length > 0) {
          problems.push(`uncaught: ${health.pageErrors.join(" | ")}`)
        }

        const mainText = await waitForMainText(page)
        if (mainText.length === 0) problems.push("main content is empty")

        if (problems.length > 0) {
          failures.push(`${href} → ${problems.join("; ")}`)
        }
      }

      health.stop()

      expect(
        failures,
        `Routes that failed to render for ${persona.label}:\n${failures.join("\n")}`,
      ).toEqual([])
    })
  })
}
