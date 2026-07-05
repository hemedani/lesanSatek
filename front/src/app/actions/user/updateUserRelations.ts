"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const updateUserRelations = async (
  data: ReqType["main"]["user"]["updateUserRelations"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["updateUserRelations"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "updateUserRelations",
      details: {
        set: data,
        get: getSelection || { _id: 1, first_name: 1, last_name: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی روابط کاربر" },
    };
  }
};
