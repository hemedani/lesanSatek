"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["goodsReceipt"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["goodsReceipt"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "goodsReceipt",
      act: "gets",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, receiptNumber: 1, status: 1, receivedAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست رسید کالا" },
    };
  }
};
