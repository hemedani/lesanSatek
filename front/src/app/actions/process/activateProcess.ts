"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const activateProcess = async (
  data: ReqType["main"]["process"]["activateProcess"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["process"]["activateProcess"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "process",
      act: "activateProcess",
      details: {
        set: data,
        get: getSelection || { _id: 1, name: 1, isActive: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در فعال‌سازی فرآیند" },
    };
  }
};
