"use server"

import { runLesanAction } from "@/lib/lesan-action"

export const remove = async (data: {
  _id: string
  hardCascade?: boolean
  activeRoleId?: string
}) =>
  runLesanAction(
    "account",
    "remove",
    data,
    { success: 1 },
    "خطا در حذف حساب",
  )
