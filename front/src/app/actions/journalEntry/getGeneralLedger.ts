"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntry"]["getGeneralLedger"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const getGeneralLedger = async (data: SetType) =>
  runLesanAction(
    "journalEntry",
    "getGeneralLedger",
    data,
    {},
    "خطا در تهیه دفتر کل",
  )
