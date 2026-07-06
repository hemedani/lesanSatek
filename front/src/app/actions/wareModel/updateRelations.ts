"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const updateRelations = async (
  data: ReqType["main"]["wareModel"]["updateRelations"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["wareModel"]["updateRelations"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "wareModel",
      act: "updateRelations",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی روابط مدل کالا" },
    };
  }
};
