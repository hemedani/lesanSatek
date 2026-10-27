"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntry"]["getIncomeStatement"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const getIncomeStatement = async (data: SetType) =>
  runLesanAction(
    "journalEntry",
    "getIncomeStatement",
    data,
    {},
    "خطا در تهیه صورت سود و زیان",
  )
