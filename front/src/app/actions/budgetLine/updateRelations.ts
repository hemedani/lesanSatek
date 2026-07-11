"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const updateRelations = async (
  data: {
    _id: string;
    fiscalYearId?: string;
  }
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetLine",
      act: "updateRelations",
      details: {
        set: { ...data, activeRoleId },
        get: { _id: 1 as const, code: 1 as const, title: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی روابط ردیف بودجه" },
    };
  }
};
