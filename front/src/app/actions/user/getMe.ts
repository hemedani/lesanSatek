"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getMe = async (
  getSelection?: DeepPartial<ReqType["main"]["user"]["getMe"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "getMe",
      details: {
        set: {},
        get: getSelection || { _id: 1, first_name: 1, last_name: 1, email: 1, roles: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت اطلاعات کاربر" },
    };
  }
};
