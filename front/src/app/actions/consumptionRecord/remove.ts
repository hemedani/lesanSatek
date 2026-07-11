"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const remove = async (
  data: {
    _id: string;
    hardCascade?: boolean;
  }
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "consumptionRecord",
      act: "remove",
      details: {
        set: { ...data, activeRoleId },
        get: { success: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در حذف مصرف" },
    };
  }
};
