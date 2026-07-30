"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const count = async (
  data: {
    activeRoleId?: string;
    unitId?: string;
    wareModelId?: string;
    reason?: string;
    consumedFor?: string;
  }
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main" as const,
      model: "consumption" as const,
      act: "count" as any,
      details: {
        set: { ...data, activeRoleId } as any,
        get: { qty: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش مصرف‌ها" },
    };
  }
};
