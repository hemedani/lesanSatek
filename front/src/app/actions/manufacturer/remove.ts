"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";

export const remove = async (
  data: {
    activeRoleId: string;
    _id: string;
    hardCascade?: boolean;
  }
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "manufacturer",
      act: "remove",
      details: {
        set: data,
        get: { success: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در حذف تولیدکننده" },
    };
  }
};
