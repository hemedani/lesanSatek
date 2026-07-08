"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["file"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["file"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "file",
      act: "get",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, name: 1, mimeType: 1, type: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت فایل" },
    };
  }
};
