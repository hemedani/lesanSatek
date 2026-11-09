import type { Page } from "@playwright/test"

/**
 * Accessibility helpers.
 *
 * The app is RTL/Persian and relies on `<Label>` + `FormControl` wiring for
 * every field. A single mis-wired `htmlFor` silently produces a control with no
 * accessible name — screen readers announce "edit text" and Playwright's
 * `getByLabel` times out, which is how this class of bug was first found.
 */

export interface UnnamedControl {
  /** Short HTML snippet so the failure message points at the offending field. */
  snippet: string
  /** Why the helper considered the control unnamed. */
  reason: string
}

/**
 * Collects every form control inside `<main>` that has no accessible name.
 *
 * Ignored on purpose:
 *  - `type="hidden"` inputs (never focusable)
 *  - anything inside (or itself) `aria-hidden="true"` — base-ui renders a
 *    hidden proxy input for radio/select groups that is intentionally hidden
 */
export async function findUnnamedControls(page: Page): Promise<UnnamedControl[]> {
  return page.evaluate(() => {
    const isHidden = (el: Element): boolean => {
      if (el.getAttribute("aria-hidden") === "true") return true
      return el.closest('[aria-hidden="true"]') !== null
    }

    const textOf = (root: Element | null): string =>
      (root?.textContent ?? "").replace(/\s+/g, " ").trim()

    const accessibleName = (el: Element): string => {
      const ariaLabel = el.getAttribute("aria-label")
      if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim()

      const labelledBy = el.getAttribute("aria-labelledby")
      if (labelledBy) {
        const joined = labelledBy
          .split(/\s+/)
          .map((id) => textOf(document.getElementById(id)))
          .join(" ")
          .trim()
        if (joined) return joined
      }

      const id = el.getAttribute("id")
      if (id) {
        const explicit = document.querySelector(
          `label[for="${CSS.escape(id)}"]`,
        )
        const text = textOf(explicit)
        if (text) return text
      }

      const wrapping = el.closest("label")
      if (wrapping) {
        const text = textOf(wrapping)
        if (text) return text
      }

      return ""
    }

    const found: { snippet: string; reason: string }[] = []
    const controls = Array.from(
      document.querySelectorAll("main input, main textarea, main select"),
    )

    for (const el of controls) {
      if (isHidden(el)) continue
      if (el instanceof HTMLInputElement && el.type === "hidden") continue

      const name = accessibleName(el)
      if (name) continue

      found.push({
        snippet: el.outerHTML.slice(0, 160),
        reason: "no <label for>, aria-label, aria-labelledby, or wrapping <label>",
      })
    }

    return found
  })
}
