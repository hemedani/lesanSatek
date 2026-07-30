"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const gets = async (
  data: {
    activeRoleId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    unitId?: string;
    wareModelId?: string;
    reason?: string;
    consumedFor?: string;
  },
  getSelection?: any
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main" as const,
      model: "consumption" as const,
      act: "gets" as any,
      details: {
        set: { ...data, activeRoleId } as any,
        get: (getSelection || { _id: 1, quantity: 1, consumedAt: 1, reason: 1 }) as any,
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست مصرف‌ها" },
    };
  }
};
