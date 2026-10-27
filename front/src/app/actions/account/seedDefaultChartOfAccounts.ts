"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["account"]["seedDefaultChartOfAccounts"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const seedDefaultChartOfAccounts = async (data: SetType) =>
  runLesanAction(
    "account",
    "seedDefaultChartOfAccounts",
    data,
    { success: 1 },
    "خطا در راه‌اندازی کدینگ حساب‌ها",
  )
