import type { Page } from "@playwright/test"

/**
 * Selectors for the "ثبت درخواست خرید جدید" form.
 *
 * `FormLabel` in `src/components/ui/form.tsx` points its `htmlFor` at the
 * wrapper `<div>` rendered by `FormControl`, not at the actual control, so the
 * inputs have no accessible name and `getByLabel` does not work. These helpers
 * keep that workaround in one place; when the label/control association is
 * fixed, only this file needs to change.
 */
export const NEW_REQUEST_FORM = {
  titlePlaceholder: "مثلاً: خرید لپ‌تاپ برای واحد فناوری",
  submitButton: "ثبت درخواست",
  wareModelTrigger: "مدل کالا",
  requestingUnitTrigger: "واحد درخواست‌کننده",
} as const

export async function fillNewRequestBasics(
  page: Page,
  values: { title: string; quantity?: string },
): Promise<void> {
  await page.getByPlaceholder(NEW_REQUEST_FORM.titlePlaceholder).fill(values.title)

  if (values.quantity !== undefined) {
    await page.getByRole("spinbutton").fill(values.quantity)
  }
}

export async function pickFirstWareModel(page: Page): Promise<string> {
  await page.getByRole("button", { name: NEW_REQUEST_FORM.wareModelTrigger }).click()

  const firstOption = page.getByRole("option").first()
  await firstOption.waitFor({ state: "visible" })

  const label = ((await firstOption.innerText()) || "").trim()
  await firstOption.click()

  return label
}

export async function submitNewRequest(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: NEW_REQUEST_FORM.submitButton, exact: true })
    .click()
}
