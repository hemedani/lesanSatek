"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const count = async (
  data: ReqType["main"]["tag"]["count"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tag"]["count"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "tag",
      act: "count",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { qty: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در شمارش برچسب‌ها" },
    };
  }
};
