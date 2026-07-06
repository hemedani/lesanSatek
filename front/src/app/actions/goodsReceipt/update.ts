"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const update = async (
  data: ReqType["main"]["goodsReceipt"]["update"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["goodsReceipt"]["update"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "goodsReceipt",
      act: "update",
      details: {
        set: data,
        get: getSelection || { _id: 1, receiptNumber: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی رسید کالا" },
    };
  }
};
