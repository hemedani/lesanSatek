import { expect, test } from "@playwright/test"

import {
  pendingApprovalsFor,
  pendingBadgeCountFor,
  storageStateFor,
} from "../support/api"
import {
  fillNewRequestBasics,
  pickFirstWareModel,
  submitNewRequest,
} from "../support/new-request-form"

/**
 * Write-path coverage for the purchasing lifecycle:
 *
 *   employee creates a Draft  →  unit head approves a pending request
 *
 * These tests mutate the shared database (a new Draft is inserted, and one
 * pending request advances a step), so they only run when explicitly enabled:
 *
 *   E2E_ALLOW_MUTATIONS=1 pnpm test:e2e
 *
 * Reseed afterwards with `python3 ignore-scripts/_run_e2e.py` to restore the
 * fixture set.
 */

const mutationsEnabled = process.env.E2E_ALLOW_MUTATIONS === "1"

test.describe("Purchasing lifecycle — create a draft", () => {
  test.use({ storageState: storageStateFor("employee") })

  test("employee registers a new purchasing request", async ({ page }) => {
    test.skip(
      !mutationsEnabled,
      "mutating test — run with E2E_ALLOW_MUTATIONS=1",
    )

    const title = `E2E درخواست خرید ${Date.now()}`

    await page.goto("/requests/new")
    await expect(
      page.getByRole("heading", { name: "ثبت درخواست خرید جدید" }),
    ).toBeVisible()

    await fillNewRequestBasics(page, { title, quantity: "3" })
    await pickFirstWareModel(page)
    await submitNewRequest(page)

    await expect(page.getByText("درخواست خرید با موفقیت ایجاد شد")).toBeVisible()
    await expect(page).toHaveURL(/\/requests\/[a-f0-9]{24}/, {
      timeout: 30_000,
    })
    await expect(page.getByText(title).first()).toBeVisible()

    // The new request shows up in the requester's list.
    await page.goto("/requests/my-requests")
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

test.describe("Purchasing lifecycle — approve a pending request", () => {
  test.use({ storageState: storageStateFor("unitHeadWarehouse") })

  test("unit head approves the current step of a pending request", async ({
    page,
  }) => {
    test.skip(
      !mutationsEnabled,
      "mutating test — run with E2E_ALLOW_MUTATIONS=1",
    )

    const before = await pendingApprovalsFor("unitHeadWarehouse")
    const badgeBefore = await pendingBadgeCountFor("unitHeadWarehouse")

    expect(
      before.length,
      "needs a pending request for the warehouse unit",
    ).toBeGreaterThan(0)

    const target = before[0]

    await page.goto(`/unit-head/requests/${target._id}`)
    await page.getByRole("button", { name: "تایید", exact: true }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "تایید", exact: true }).click()

    await expect(page.getByText("درخواست با موفقیت تایید شد")).toBeVisible()

    // The queue and the dashboard badge both drop the request.
    const after = await pendingApprovalsFor("unitHeadWarehouse")
    const badgeAfter = await pendingBadgeCountFor("unitHeadWarehouse")

    expect(after.map((item) => item._id)).not.toContain(target._id)
    expect(after.length).toBe(before.length - 1)
    expect(badgeAfter).toBe(after.length)
    expect(badgeAfter).toBeLessThan(badgeBefore)
  })
})
