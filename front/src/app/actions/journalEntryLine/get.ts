"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntryLine"]["get"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const get = async (
  data: SetType,
  getSelection?: DeepPartial<
    ReqType["main"]["journalEntryLine"]["get"]["get"]
  >,
) =>
  runLesanAction(
    "journalEntryLine",
    "get",
    data,
    getSelection || {
      _id: 1,
      lineNumber: 1,
      description: 1,
      debit: 1,
      credit: 1,
      account: { _id: 1, code: 1, name: 1, accountType: 1 },
      costCenter: { _id: 1, code: 1, name: 1 },
      store: { _id: 1, name: 1 },
      unit: { _id: 1, name: 1 },
    },
    "خطا در دریافت ردیف سند",
  )
