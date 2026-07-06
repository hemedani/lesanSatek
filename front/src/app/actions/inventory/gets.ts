"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["inventory"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["inventory"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "inventory",
      act: "gets",
      details: {
        set: data,
        get: getSelection || { _id: 1, quantity: 1, batchNo: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست موجودی انبار" },
    };
  }
};
