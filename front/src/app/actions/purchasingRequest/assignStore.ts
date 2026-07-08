"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const assignStore = async (
  data: ReqType["main"]["purchasingRequest"]["assignStore"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["assignStore"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "assignStore",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تخصیص فروشگاه" },
    };
  }
};
