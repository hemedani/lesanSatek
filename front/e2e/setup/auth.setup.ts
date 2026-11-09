import { expect, test } from "@playwright/test"

import { createPersonaSession, storageStateFor } from "../support/api"
import { ALL_PERSONA_KEYS, PERSONAS } from "../support/personas"

/**
 * Authenticates every persona once and stores the resulting cookies under
 * `e2e/.auth/<persona>.json`. Specs then start already signed in.
 *
 * Going through the backend API (instead of the login form) keeps the suite
 * fast and lets each persona pin a *specific* role — several seed accounts own
 * more than one role and the login form picks the highest one.
 *
 * The real login form is still covered end-to-end in `specs/auth.spec.ts`.
 */
for (const key of ALL_PERSONA_KEYS) {
  const persona = PERSONAS[key]

  test(`authenticate ${persona.label} (${persona.email})`, async ({ page }) => {
    const session = await createPersonaSession(key)

    expect(session.token, "backend token").toBeTruthy()
    expect(session.role.name).toBe(persona.roleName)

    // Prove the cookies actually open a guarded panel.
    await page.context().addCookies(session.cookies)
    const response = await page.goto(persona.homePath, {
      waitUntil: "domcontentloaded",
    })

    expect(response?.status(), `${persona.homePath} should render`).toBeLessThan(
      400,
    )
    await expect(page).toHaveURL(new RegExp(`${persona.homePath.replace("/", "\\/")}$`))

    expect(storageStateFor(key)).toBeTruthy()
  })
}
