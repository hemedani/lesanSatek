"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const uploadFile = async (
  data: ReqType["main"]["file"]["uploadFile"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["file"]["uploadFile"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "file",
      act: "uploadFile",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, name: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در آپلود فایل" },
    };
  }
};
