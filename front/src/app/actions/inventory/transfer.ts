"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const transfer = async (
  data: ReqType["main"]["inventory"]["transfer"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["inventory"]["transfer"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "inventory",
      act: "transfer",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, quantity: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در انتقال موجودی انبار" },
    };
  }
};
