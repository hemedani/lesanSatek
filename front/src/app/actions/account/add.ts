"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["account"]["add"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const add = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["account"]["add"]["get"]>,
) =>
  runLesanAction(
    "account",
    "add",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
    },
    "خطا در ایجاد حساب",
  )
