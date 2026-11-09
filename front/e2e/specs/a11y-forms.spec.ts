import { expect, test } from "@playwright/test"

import { findUnnamedControls } from "../support/a11y"
import { storageStateFor } from "../support/api"
import { expectHealthyPage, waitForMainText, watchPageHealth } from "../support/page-health"
import type { PersonaKey } from "../support/personas"

/**
 * Every create/edit form must expose a programmatic name for each control.
 *
 * This started as a one-off probe after `getByLabel("تعداد")` timed out on the
 * new-request form: `FormLabel`'s `htmlFor` pointed at the `FormControl`
 * wrapper `<div>` instead of the actual input. That single bug broke every
 * labelled field in the app for both screen readers and the test suite, so it
 * is now guarded across the representative create forms of each panel.
 */

interface FormRoute {
  persona: PersonaKey
  path: string
  /** Copy that proves the form actually rendered (not a skeleton or an error). */
  expectText: RegExp
}

const FORM_ROUTES: FormRoute[] = [
  { persona: "manager", path: "/admin/users/add", expectText: /رمز عبور/ },
  { persona: "manager", path: "/admin/organizations/add", expectText: /نام/ },
  { persona: "manager", path: "/admin/processes/add", expectText: /نام/ },
  { persona: "orgHead", path: "/orghead/users/add", expectText: /رمز عبور/ },
  { persona: "orgHead", path: "/orghead/units/add", expectText: /نام/ },
  { persona: "storeHead", path: "/storehead/stuff/add", expectText: /./ },
  { persona: "employee", path: "/requests/new", expectText: /عنوان/ },
]

const byPersona = new Map<PersonaKey, FormRoute[]>()
for (const route of FORM_ROUTES) {
  const list = byPersona.get(route.persona) ?? []
  list.push(route)
  byPersona.set(route.persona, list)
}

for (const [persona, routes] of byPersona) {
  test.describe(`accessible form controls — ${persona}`, () => {
    test.use({ storageState: storageStateFor(persona) })

    for (const route of routes) {
      test(`${route.path} labels every control`, async ({ page }) => {
        const health = watchPageHealth(page)

        await page.goto(route.path)
        const mainText = await waitForMainText(page)

        expect(
          mainText,
          `${route.path}: the form did not render`,
        ).toMatch(route.expectText)

        const unnamed = await findUnnamedControls(page)
        expect(
          unnamed,
          `${route.path}: controls without an accessible name\n${unnamed
            .map((item) => `  - ${item.reason}\n    ${item.snippet}`)
            .join("\n")}`,
        ).toEqual([])

        await expectHealthyPage(page, health, route.path)
        health.stop()
      })
    }
  })
}
