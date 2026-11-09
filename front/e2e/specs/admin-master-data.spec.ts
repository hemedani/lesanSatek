import { expect, test } from "@playwright/test"

import { storageStateFor } from "../support/api"
import { cardCount, entityIds, openPage } from "../support/domain"
import { expectHealthyPage, watchPageHealth } from "../support/page-health"

/**
 * Admin master data: every catalogue the manager owns — the ware taxonomy
 * (type → class → group → model → ware), manufacturers, stores, geography,
 * organisational units, users, organisations and processes.
 *
 * The shared contract for a list page is: a title, a rendered count that agrees
 * with the number of cards on screen, and cards that lead somewhere useful.
 */

test.use({ storageState: storageStateFor("manager") })

interface AdminListPage {
  path: string
  title: string
  /** Minimum number of seeded records expected. */
  minItems: number
  /** Set when cards link to `/<basePath>/<id>`; otherwise cards are button-only. */
  basePath?: string
  addPath: string
  /** Header badge text, when the page renders one. */
  badge?: RegExp
}

const PAGES: AdminListPage[] = [
  {
    path: "/admin/ware-types",
    title: "انواع کالا",
    minItems: 3,
    addPath: "/admin/ware-types/add",
    badge: /۳ نوع کالا/,
  },
  {
    path: "/admin/ware-classes",
    title: "کلاس‌های کالا",
    minItems: 3,
    addPath: "/admin/ware-classes/add",
    badge: /۳ کلاس کالا/,
  },
  {
    path: "/admin/ware-groups",
    title: "گروه‌های کالا",
    minItems: 3,
    addPath: "/admin/ware-groups/add",
    badge: /۳ گروه کالا/,
  },
  {
    path: "/admin/ware-models",
    title: "مدل‌های کالا",
    minItems: 3,
    addPath: "/admin/ware-models/add",
    badge: /۳ مدل کالا/,
  },
  {
    path: "/admin/wares",
    title: "کالاها",
    minItems: 3,
    basePath: "/admin/wares",
    addPath: "/admin/wares/add",
    badge: /۳ کالا/,
  },
  {
    path: "/admin/manufacturers",
    title: "تولیدکنندگان",
    minItems: 2,
    addPath: "/admin/manufacturers/add",
    badge: /۲ تولیدکننده/,
  },
  {
    path: "/admin/stores",
    title: "مدیریت فروشگاه‌ها",
    minItems: 2,
    addPath: "/admin/stores/add",
    badge: /۲ فروشگاه/,
  },
  {
    path: "/admin/states",
    title: "مدیریت استان‌ها",
    minItems: 1,
    basePath: "/admin/states",
    addPath: "/admin/states/add",
  },
  {
    path: "/admin/cities",
    title: "مدیریت شهرها",
    minItems: 1,
    basePath: "/admin/cities",
    addPath: "/admin/cities/add",
  },
  {
    path: "/admin/units",
    title: "واحدها",
    minItems: 14,
    basePath: "/admin/units",
    addPath: "/admin/units/add",
  },
  {
    path: "/admin/users",
    title: "کاربران",
    minItems: 17,
    basePath: "/admin/users",
    addPath: "/admin/users/add",
  },
  {
    path: "/admin/organizations",
    title: "سازمان‌ها",
    minItems: 2,
    basePath: "/admin/organizations",
    addPath: "/admin/organizations/add",
  },
  {
    path: "/admin/processes",
    title: "فرآیندها",
    minItems: 6,
    basePath: "/admin/processes",
    addPath: "/admin/processes/add",
  },
]

test.describe("Admin master data", () => {
  for (const entry of PAGES) {
    test(`${entry.path} lists its records`, async ({ page }) => {
      const health = watchPageHealth(page)
      const text = await openPage(page, entry.path)

      await expect(
        page.getByRole("heading", { level: 1, name: entry.title }),
      ).toBeVisible()

      const count = entry.basePath
        ? (await entityIds(page, entry.basePath)).length
        : await cardCount(page)

      expect(
        count,
        `${entry.path} rendered ${count} records, expected at least ${entry.minItems}`,
      ).toBeGreaterThanOrEqual(entry.minItems)

      if (entry.badge) {
        expect(text).toMatch(entry.badge)
      }

      // The add action must be present and point at the create route.
      await expect(
        page.getByRole("main").locator(`a[href="${entry.addPath}"]`).first(),
        `${entry.path} has no link to ${entry.addPath}`,
      ).toBeVisible()

      await expectHealthyPage(page, health, entry.path)
      health.stop()
    })
  }

  test("searching a catalogue narrows the result set", async ({ page }) => {
    const cases = [
      { path: "/admin/ware-types", label: "جستجوی نوع کالا…", query: "پانسمان", expect: "پانسمان" },
      { path: "/admin/users", label: "جستجوی کاربر", query: "سارا", expect: "سارا" },
      { path: "/admin/units", label: "جستجوی واحد", query: "آزمایشگاه", expect: "آزمایشگاه" },
    ]

    for (const item of cases) {
      await openPage(page, item.path)

      const field = page.getByLabel(item.label, { exact: true })
      await expect(field, `${item.path} has no search field`).toBeVisible()

      await field.fill(item.query)
      await field.press("Enter")

      await expect
        .poll(() => page.url(), { message: `${item.path} did not filter` })
        .toContain("search=")

      await expect(
        page.getByRole("main").getByText(item.expect, { exact: false }).first(),
      ).toBeVisible()
    }
  })

  test("a filtered search with no matches shows the empty state", async ({
    page,
  }) => {
    await openPage(page, "/admin/ware-types")

    const field = page.getByLabel("جستجوی نوع کالا…", { exact: true })
    await field.fill("zzz-no-such-catalogue-entry")
    await field.press("Enter")

    await expect
      .poll(() => page.url(), { message: "search did not reach the URL" })
      .toContain("search=")

    // No rows, and the way out is to clear the filters.
    await expect(
      page.getByRole("main").getByText("هنوز نوع کالایی ثبت نشده است", {
        exact: false,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "پاک کردن فیلترها", exact: true }).first(),
    ).toBeVisible()
  })

  test("the create form validates required fields", async ({ page }) => {
    const health = watchPageHealth(page)
    await openPage(page, "/admin/ware-types/add")

    await expect(
      page.getByRole("heading", { level: 1 }).first(),
    ).toBeVisible()

    await page.getByRole("button", { name: /ثبت|ذخیره/, exact: false }).first().click()

    // Required-field messages are rendered by zod; at least one must appear.
    await expect(
      page.locator("main").getByText("الزامی است", { exact: false }).first(),
    ).toBeVisible()

    await expectHealthyPage(page, health, "ware type create form")
    health.stop()
  })

  test("a record opens a populated edit page", async ({ page }) => {
    const health = watchPageHealth(page)
    await openPage(page, "/admin/ware-types")

    await page.getByRole("main").locator('button[title="ویرایش"]').first().click()

    await expect
      .poll(() => page.url(), { message: "edit action did not navigate" })
      .toMatch(/\/admin\/ware-types\/[a-f0-9]{24}/)

    // The form must arrive with the record's values, not blank inputs.
    const nameInput = page.locator("main input").first()
    await expect(nameInput).not.toHaveValue("")

    await expectHealthyPage(page, health, "ware type edit form")
    health.stop()
  })

  test("the tags page renders its empty state and offers creation", async ({
    page,
  }) => {
    const text = await openPage(page, "/admin/tags")

    expect(text).toContain("برچسب")
    await expect(
      page.getByRole("main").getByText("برچسبی یافت نشد", { exact: false }).first(),
    ).toBeVisible()
  })

  test("deleting a record asks for confirmation first", async ({ page }) => {
    await openPage(page, "/admin/ware-types")

    await page.getByRole("main").locator('button[title="حذف"]').first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText("حذف")

    // Cancel must leave the record in place.
    await dialog.getByRole("button", { name: /انصراف|لغو/, exact: false }).first().click()
    await expect(dialog).toBeHidden()

    const count = await cardCount(page)
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test("the user list shows every seeded account", async ({ page }) => {
    await openPage(page, "/admin/users")
    const ids = await entityIds(page, "/admin/users")

    // 17 accounts are seeded; the page must render all of them (limit is 20).
    expect(ids.length).toBe(17)

    // Each card links to the user's detail, roles and relations pages.
    const first = ids[0]
    await expect(
      page.getByRole("main").locator(`a[href="/admin/users/${first}"]`).first(),
    ).toBeVisible()
    await expect(
      page.getByRole("main").locator(`a[href="/admin/users/${first}/roles"]`),
    ).toHaveCount(1)
    await expect(
      page.getByRole("main").locator(`a[href="/admin/users/${first}/relations"]`),
    ).toHaveCount(1)
  })

  test("both seeded organisations are listed with their heads", async ({
    page,
  }) => {
    const text = await openPage(page, "/admin/organizations")
    const ids = await entityIds(page, "/admin/organizations")

    expect(ids.length).toBe(2)
    expect(text).toContain("سازمان آلفا")
    expect(text).toContain("سازمان بتا")
    expect(text).toMatch(/رئیس/)
  })
})
