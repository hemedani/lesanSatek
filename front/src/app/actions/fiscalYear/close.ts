"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const close = async (
  data: ReqType["main"]["fiscalYear"]["close"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["fiscalYear"]["close"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "fiscalYear",
      act: "close",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, name: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در بستن سال مالی" },
    };
  }
};
