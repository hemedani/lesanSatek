"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntry"]["getTrialBalance"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const getTrialBalance = async (data: SetType) =>
  runLesanAction(
    "journalEntry",
    "getTrialBalance",
    data,
    {},
    "خطا در تهیه تراز آزمایشی",
  )
