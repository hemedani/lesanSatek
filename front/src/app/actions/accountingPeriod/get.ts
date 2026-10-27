"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["accountingPeriod"]["get"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const get = async (
  data: SetType,
  getSelection?: DeepPartial<
    ReqType["main"]["accountingPeriod"]["get"]["get"]
  >,
) =>
  runLesanAction(
    "accountingPeriod",
    "get",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      startDate: 1,
      endDate: 1,
      status: 1,
      closedAt: 1,
      organization: { _id: 1, name: 1 },
      fiscalYear: { _id: 1, name: 1 },
      closedBy: { _id: 1, first_name: 1, last_name: 1 },
    },
    "خطا در دریافت دوره حسابداری",
  )
