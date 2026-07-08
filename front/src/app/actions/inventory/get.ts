"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["inventory"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["inventory"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "inventory",
      act: "get",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, quantity: 1, batchNo: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت موجودی انبار" },
    };
  }
};
