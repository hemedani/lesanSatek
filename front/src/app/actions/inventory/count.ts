"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const count = async (
  data: {
    wareId?: string;
    wareModelId?: string;
    unitId?: string;
    warehouseUnitId?: string;
  } = {},
  getSelection?: { qty?: 0 | 1 }
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "inventory",
      act: "count",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { qty: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش موجودی انبار" },
    };
  }
};
