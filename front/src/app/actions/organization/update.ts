"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";

export const update = async (
  data: {
    activeRoleId: string;
    _id: string;
    name?: string;
    enName?: string;
    description?: string;
    isActive?: boolean;
  },
  getSelection?: Record<string, unknown>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "organization",
      act: "update",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی سازمان" },
    };
  }
};
