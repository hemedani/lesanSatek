"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const update = async (
  data: ReqType["main"]["paymentOrder"]["update"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["paymentOrder"]["update"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "paymentOrder",
      act: "update",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, amount: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در به‌روزرسانی دستور پرداخت" },
    };
  }
};
