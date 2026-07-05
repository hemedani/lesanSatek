"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["tag"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tag"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "tag",
      act: "get",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1, color: 1, icon: 1, description: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت برچسب" },
    };
  }
};
