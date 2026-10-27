"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntryLine"]["gets"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const gets = async (
  data: SetType,
  getSelection?: DeepPartial<
    ReqType["main"]["journalEntryLine"]["gets"]["get"]
  >,
) =>
  runLesanAction(
    "journalEntryLine",
    "gets",
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
    "خطا در دریافت ردیف‌های سند",
  )
