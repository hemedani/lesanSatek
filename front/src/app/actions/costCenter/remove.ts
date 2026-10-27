"use server"

import { runLesanAction } from "@/lib/lesan-action"

export const remove = async (data: {
  _id: string
  hardCascade?: boolean
  activeRoleId?: string
}) =>
  runLesanAction(
    "costCenter",
    "remove",
    data,
    { success: 1 },
    "خطا در حذف مرکز هزینه",
  )
