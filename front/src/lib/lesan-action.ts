import { AppApi } from "@/lib/api"
import { getActiveRoleId, getToken } from "@/lib/auth"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LesanActionResult = { success: boolean; body: any }

export async function runLesanAction(
  model: string,
  act: string,
  data: object,
  getSelection: object,
  fallbackMessage: string,
): Promise<LesanActionResult> {
  try {
    const token = await getToken()
    const activeRoleId = await getActiveRoleId()
    const payload = data as Record<string, unknown>
    const result = await AppApi(undefined, token).send({
      service: "main",
      model,
      act,
      details: {
        set: {
          ...payload,
          ...(activeRoleId
            ? { activeRoleId }
            : payload.activeRoleId
            ? { activeRoleId: payload.activeRoleId }
            : {}),
        },
        get: getSelection,
      },
    } as never)

    return result as LesanActionResult
  } catch (error: unknown) {
    return {
      success: false,
      body: {
        message:
          error instanceof Error ? error.message : fallbackMessage,
      },
    }
  }
}
