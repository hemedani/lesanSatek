"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getMe = async (
  getSelection?: DeepPartial<ReqType["main"]["user"]["getMe"]["get"]>
) => {
  try {
    const token = await getToken();
    if (!token) {
      return { success: false, body: { message: "توکن یافت نشد" } };
    }

    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "getMe",
      details: {
        set: {},
        get: getSelection || {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          email: 1,
          is_verified: 1,
          isActive: 1,
          isGhost: 1,
          position: 1,
          features: 1,
          roles: 1,
          organization: { _id: 1, name: 1 },
          avatar: { _id: 1, name: 1 },
        },
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
