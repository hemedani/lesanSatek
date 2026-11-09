import { expect, test } from "@playwright/test"

import {
  activeRoleIdFor,
  callAs,
  storageStateFor,
} from "../support/api"
import { expectHealthyPage, watchPageHealth } from "../support/page-health"

/**
 * OrgHead role assignment is unit-based.
 *
 * The OrgHead can only grant roles inside their own organization, so the
 * add-role form exposes exactly two choices: the role and one of the
 * organization's units. The scope type ("حوزه دسترسی") and the organization
 * field are derived automatically and must not be rendered.
 */

test.use({ storageState: storageStateFor("orgHead") })

interface UnitRow {
  _id?: string
  name?: string
}

interface UserRow {
  _id?: string
}

async function orgUnits(): Promise<string[]> {
  const activeRoleId = activeRoleIdFor("orgHead")
  const result = await callAs<UnitRow[]>("orgHead", {
    service: "main",
    model: "unit",
    act: "gets",
    details: {
      set: { activeRoleId, page: 1, limit: 100 },
      get: { _id: 1, name: 1 },
    },
  })

  return (result.body as UnitRow[]).map((unit) => unit.name || "").filter(Boolean)
}

async function firstUserId(): Promise<string> {
  const activeRoleId = activeRoleIdFor("orgHead")
  const result = await callAs<UserRow[]>("orgHead", {
    service: "main",
    model: "user",
    act: "getUsers",
    details: {
      set: { activeRoleId, page: 1, limit: 50 },
      get: { _id: 1 },
    },
  })

  const user = (result.body as UserRow[])[0]
  if (!user?._id) throw new Error("seed data must contain a user in the OrgHead organization")
  return user._id
}

test.describe("OrgHead — user role assignment", () => {
  test("edit-user form only offers a role and the organization's units", async ({
    page,
  }) => {
    const userId = await firstUserId()
    const units = await orgUnits()
    expect(units.length).toBeGreaterThan(0)

    const health = watchPageHealth(page)
    await page.goto(`/orghead/users/${userId}`)

    await expect(page.getByText("نقش‌ها و دسترسی‌ها")).toBeVisible()

    await expect(page.getByLabel("انتخاب نقش")).toBeVisible()
    await expect(page.getByLabel("انتخاب حوزه دسترسی")).toHaveCount(0)

    await page.getByText("انتخاب واحد سازمانی…", { exact: false }).first().click()

    const options = page.locator("[cmdk-item]")
    await expect(options.first()).toBeVisible()

    const rendered = (await options.allTextContents())
      .map((text) => text.trim())
      .filter(Boolean)

    expect(rendered.sort()).toEqual([...units].sort())

    await expectHealthyPage(page, health, "orghead edit-user roles")
    health.stop()
  })

  test("add-user form hides the scope and organization fields", async ({
    page,
  }) => {
    const health = watchPageHealth(page)
    await page.goto("/orghead/users/add")

    await expect(page.getByText("نقش‌ها", { exact: true }).first()).toBeVisible()

    await expect(page.getByText("حوزه", { exact: true })).toHaveCount(0)
    await expect(page.getByText("سازمان", { exact: true })).toHaveCount(0)
    await expect(page.getByText("واحد سازمانی", { exact: false })).not.toHaveCount(0)

    await expectHealthyPage(page, health, "orghead add-user roles")
    health.stop()
  })
})
