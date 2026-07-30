"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const add = async (
  data: Omit<ReqType["main"]["consumption"]["add"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["consumption"]["add"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "consumption",
      act: "add",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, quantity: 1, consumedAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت مصرف" },
    };
  }
};
