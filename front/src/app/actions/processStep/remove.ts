"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const remove = async (
  data: ReqType["main"]["processStep"]["remove"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["processStep"]["remove"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "processStep",
      act: "remove",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { success: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در حذف گام فرآیند" },
    };
  }
};
