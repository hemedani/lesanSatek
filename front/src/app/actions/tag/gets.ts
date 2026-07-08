"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["tag"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tag"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "tag",
      act: "gets",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, name: 1, color: 1, icon: 1, description: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست برچسب‌ها" },
    };
  }
};
