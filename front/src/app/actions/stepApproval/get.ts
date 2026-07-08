"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["stepApproval"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["stepApproval"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "stepApproval",
      act: "get",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, status: 1, comment: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت تایید مرحله" },
    };
  }
};
