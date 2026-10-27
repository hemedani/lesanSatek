"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntry"]["get"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const get = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["journalEntry"]["get"]["get"]>,
) =>
  runLesanAction(
    "journalEntry",
    "get",
    data,
    getSelection || {
      _id: 1,
      entryNumber: 1,
      entryDate: 1,
      description: 1,
      reference: 1,
      sourceType: 1,
      sourceId: 1,
      sourceEvent: 1,
      status: 1,
      totalDebit: 1,
      totalCredit: 1,
      isBalanced: 1,
      postedAt: 1,
      lineSnapshot: 1,
      organization: { _id: 1, name: 1 },
      period: { _id: 1, code: 1, name: 1, status: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      lines: {
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
    },
    "خطا در دریافت سند حسابداری",
  )
