"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["costCenter"]["get"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const get = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["costCenter"]["get"]["get"]>,
) =>
  runLesanAction(
    "costCenter",
    "get",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      description: 1,
      type: 1,
      isActive: 1,
      organization: { _id: 1, name: 1 },
      unit: { _id: 1, name: 1 },
      responsibleUser: { _id: 1, first_name: 1, last_name: 1 },
    },
    "خطا در دریافت مرکز هزینه",
  )
