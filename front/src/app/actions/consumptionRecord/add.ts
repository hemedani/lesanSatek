"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const add = async (
  data: ReqType["main"]["consumptionRecord"]["add"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["consumptionRecord"]["add"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "consumptionRecord",
      act: "add",
      details: {
        set: data,
        get: getSelection || { _id: 1, quantity: 1, consumedAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت مصرف" },
    };
  }
};
