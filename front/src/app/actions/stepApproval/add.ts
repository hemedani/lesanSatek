"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const add = async (
  data: ReqType["main"]["stepApproval"]["add"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["stepApproval"]["add"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "stepApproval",
      act: "add",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در افزودن تایید مرحله" },
    };
  }
};
