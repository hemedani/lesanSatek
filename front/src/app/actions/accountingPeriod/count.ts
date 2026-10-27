"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["accountingPeriod"]["count"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const count = async (data: SetType) =>
  runLesanAction(
    "accountingPeriod",
    "count",
    data,
    { count: 1 },
    "خطا در شمارش دوره‌های حسابداری",
  )
