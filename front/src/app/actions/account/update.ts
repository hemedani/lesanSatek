"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["account"]["update"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const update = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["account"]["update"]["get"]>,
) =>
  runLesanAction(
    "account",
    "update",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      isActive: 1,
      isPostable: 1,
    },
    "خطا در به‌روزرسانی حساب",
  )
