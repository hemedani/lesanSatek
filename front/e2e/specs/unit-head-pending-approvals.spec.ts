import { expect, test } from "@playwright/test"

import {
  createPersonaSession,
  pendingApprovalsFor,
  pendingBadgeCountFor,
  storageStateFor,
} from "../support/api"
import { expectHealthyPage, watchPageHealth } from "../support/page-health"

/**
 * Regression suite for the "در انتظار تأیید" queue.
 *
 * Reported bug: the page rendered "درخواستی برای تایید وجود ندارد" even though
 * requests were waiting for the unit. Root cause was on the backend —
 * `getPendingByUnit` scoped the queue by `requestingUnit` (the unit that raised
 * the request) instead of by the current step's assignee units, so a unit head
 * never saw requests raised by other units.
 */

test.use({ storageState: storageStateFor("unitHeadWarehouse") })

const EMPTY_STATE_TITLE = "درخواستی برای تایید وجود ندارد"

/** 1 → "۱" so Persian-rendered counts can be matched. */
function faDigits(value: number): string {
  return value.toLocaleString("fa-IR")
}

test.describe("Unit head — pending approvals", () => {
  test("lists every request whose current step is assigned to the unit", async ({
    page,
  }) => {
    const expected = await pendingApprovalsFor("unitHeadWarehouse")

    expect(
      expected.length,
      "seed data must contain at least one request awaiting the warehouse unit",
    ).toBeGreaterThan(0)

    const health = watchPageHealth(page)
    await page.goto("/unit-head/requests/pending")

    await expect(
      page.getByRole("heading", { name: "نیازمند تایید" }),
    ).toBeVisible()

    // The exact symptom of the reported bug.
    await expect(
      page.getByText(EMPTY_STATE_TITLE),
      "empty state must not render while approvals are pending",
    ).toHaveCount(0)

    const cards = page
      .getByRole("main")
      .locator('a[href^="/unit-head/requests/"]')

    await expect(cards).toHaveCount(expected.length)

    // Each card must point at a request the API reported.
    for (const item of expected) {
      await expect(
        page.locator(`a[href="/unit-head/requests/${item._id}"]`),
      ).toHaveCount(1)
    }

    await expectHealthyPage(page, health, "pending approvals list")
  })

  test("dashboard badge matches the pending list", async ({ page }) => {
    const listCount = (await pendingApprovalsFor("unitHeadWarehouse")).length
    const badgeCount = await pendingBadgeCountFor("unitHeadWarehouse")

    expect(
      badgeCount,
      "dashboardStatistic.pendingApprovalCount must equal the list length",
    ).toBe(listCount)

    await page.goto("/unit-head")

    const pendingCard = page
      .getByRole("main")
      .locator('a[href="/unit-head/requests/pending"]')
      .first()

    await expect(pendingCard).toBeVisible()
    await expect(pendingCard).toContainText(faDigits(listCount))
  })

  test("a pending card opens a request detail page that renders", async ({
    page,
  }) => {
    const [first] = await pendingApprovalsFor("unitHeadWarehouse")
    expect(first, "need a pending request to open").toBeTruthy()

    const health = watchPageHealth(page)
    await page.goto(`/unit-head/requests/${first._id}`)

    await expect(
      page.getByRole("button", { name: "تایید", exact: true }),
    ).toBeVisible()

    if (first.title) {
      await expect(page.getByText(first.title).first()).toBeVisible()
    }

    await expectHealthyPage(page, health, "request detail")
  })

  test("an empty queue renders the empty state", async ({ page }) => {
    const financeQueue = await pendingApprovalsFor("unitHeadFinance")

    test.skip(
      financeQueue.length > 0,
      "finance unit has pending approvals in this dataset",
    )

    await page.context().clearCookies()
    const session = await createPersonaSession("unitHeadFinance")
    await page.context().addCookies(session.cookies)

    await page.goto("/unit-head/requests/pending")
    await expect(page.getByText(EMPTY_STATE_TITLE)).toBeVisible()
  })
})
