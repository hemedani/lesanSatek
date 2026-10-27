"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntryLine"]["count"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const count = async (data: SetType) =>
  runLesanAction(
    "journalEntryLine",
    "count",
    data,
    { count: 1 },
    "خطا در شمارش ردیف‌های سند",
  )
