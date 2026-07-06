"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const markPaid = async (
  data: ReqType["main"]["paymentOrder"]["markPaid"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["paymentOrder"]["markPaid"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "paymentOrder",
      act: "markPaid",
      details: {
        set: data,
        get: getSelection || { _id: 1, title: 1, status: 1, paidAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت پرداخت" },
    };
  }
};
