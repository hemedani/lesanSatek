"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["account"]["gets"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const gets = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["account"]["gets"]["get"]>,
) =>
  runLesanAction(
    "account",
    "gets",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      enName: 1,
      description: 1,
      accountType: 1,
      normalBalance: 1,
      systemKey: 1,
      level: 1,
      isPostable: 1,
      isActive: 1,
      isSystem: 1,
      organization: { _id: 1, name: 1 },
      parentAccount: { _id: 1, code: 1, name: 1 },
    },
    "خطا در دریافت لیست حساب‌ها",
  )
