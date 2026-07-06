"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["paymentOrder"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["paymentOrder"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "paymentOrder",
      act: "gets",
      details: {
        set: data,
        get: getSelection || { _id: 1, title: 1, amount: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست دستورات پرداخت" },
    };
  }
};
