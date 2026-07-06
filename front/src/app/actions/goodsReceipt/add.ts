"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const add = async (
  data: ReqType["main"]["goodsReceipt"]["add"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["goodsReceipt"]["add"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "goodsReceipt",
      act: "add",
      details: {
        set: data,
        get: getSelection || { _id: 1, receiptNumber: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت رسید کالا" },
    };
  }
};
