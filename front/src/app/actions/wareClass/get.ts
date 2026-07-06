"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["wareClass"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["wareClass"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "wareClass",
      act: "get",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت رده کالا" },
    };
  }
};
