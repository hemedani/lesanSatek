"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["processStep"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["processStep"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "processStep",
      act: "get",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {
          _id: 1,
          name: 1,
          description: 1,
          stepType: 1,
          order: 1,
          required: 1,
          process: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت گام فرآیند" },
    };
  }
};
