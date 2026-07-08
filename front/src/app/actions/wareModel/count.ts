"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const count = async (
  data: {
    activeRoleId: string;
    name?: string;
  }
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "wareModel",
      act: "count",
      details: {
        set: { ...data, activeRoleId },
        get: { qty: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش مدل‌های کالا" },
    };
  }
};
