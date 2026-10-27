"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["accountingPeriod"]["closePeriod"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const closePeriod = async (
  data: SetType,
  getSelection?: DeepPartial<
    ReqType["main"]["accountingPeriod"]["closePeriod"]["get"]
  >,
) =>
  runLesanAction(
    "accountingPeriod",
    "closePeriod",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      startDate: 1,
      endDate: 1,
      status: 1,
      closedAt: 1,
    },
    "خطا در بستن دوره حسابداری",
  )
