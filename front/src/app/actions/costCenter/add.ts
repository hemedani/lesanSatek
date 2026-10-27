"use server"

import { runLesanAction } from "@/lib/lesan-action"
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp"

type SetType = (Omit<ReqType["main"]["costCenter"]["add"]["set"], "activeRoleId"> & { activeRoleId?: string }) | Record<string, unknown>

export const add = async (
  data: SetType,
  getSelection?: DeepPartial<ReqType["main"]["costCenter"]["add"]["get"]>,
) =>
  runLesanAction(
    "costCenter",
    "add",
    data,
    getSelection || {
      _id: 1,
      code: 1,
      name: 1,
      type: 1,
      isActive: 1,
    },
    "خطا در ایجاد مرکز هزینه",
  )
