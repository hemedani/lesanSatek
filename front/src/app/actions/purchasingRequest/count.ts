"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";

export const count = async (
  data: {
    activeRoleId: string;
  }
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "count",
      details: {
        set: data,
        get: { qty: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش درخواست‌های خرید" },
    };
  }
};
