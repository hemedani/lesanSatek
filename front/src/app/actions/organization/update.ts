"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

export const update = async (
  data: {
    activeRoleId: string;
    _id: string;
    name?: string;
    enName?: string;
    description?: string;
    isActive?: boolean;
    location?: { type: "Point"; coordinates: [number, number] } | null;
  },
  getSelection?: Record<string, unknown>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const { location, ...rest } = data;
    const set = {
      ...rest,
      ...(location ? { location } : {}),
      activeRoleId,
    };
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "organization",
      act: "update",
      details: {
        set,
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
