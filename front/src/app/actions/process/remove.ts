"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const remove = async (
  data: ReqType["main"]["process"]["remove"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["process"]["remove"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "process",
      act: "remove",
      details: {
        set: data,
        get: getSelection || { success: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در حذف فرآیند" },
    };
  }
};
