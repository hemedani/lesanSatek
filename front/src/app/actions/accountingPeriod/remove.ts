"use server"

import { runLesanAction } from "@/lib/lesan-action"

export const remove = async (data: {
  _id: string
  hardCascade?: boolean
  activeRoleId?: string
}) =>
  runLesanAction(
    "accountingPeriod",
    "remove",
    data,
    { success: 1 },
    "خطا در حذف دوره حسابداری",
  )
