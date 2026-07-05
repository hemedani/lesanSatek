"use server";

import { AppApi } from "@/lib/api";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const register = async (
  data: ReqType["main"]["user"]["registerUser"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["registerUser"]["get"]>
) => {
  try {
    const result = await AppApi().send({
      service: "main",
      model: "user",
      act: "registerUser",
      details: {
        set: data,
        get: getSelection || {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          email: 1,
          is_verified: 1,
          isActive: 1,
          isGhost: 1,
        },
      },
    });

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت‌نام" },
    };
  }
};
