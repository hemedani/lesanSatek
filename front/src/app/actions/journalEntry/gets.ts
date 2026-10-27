"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["journalEntry"]["gets"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const gets = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["journalEntry"]["gets"]["get"]>,
) =>
  runLesanAction(
    "journalEntry",
    "gets",
    data,
    getSelection || {
      _id: 1,
      entryNumber: 1,
      entryDate: 1,
      description: 1,
      reference: 1,
      sourceType: 1,
      sourceId: 1,
      status: 1,
      totalDebit: 1,
      totalCredit: 1,
      isBalanced: 1,
      postedAt: 1,
      organization: { _id: 1, name: 1 },
      period: { _id: 1, code: 1, name: 1, status: 1 },
    },
    "خطا در دریافت اسناد حسابداری",
  )
