"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const remove = async (
  data: Omit<ReqType["main"]["unit"]["remove"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["unit"]["remove"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "unit",
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
      body: { message: error instanceof Error ? error.message : "خطا در حذف واحد" },
    };
  }
};
