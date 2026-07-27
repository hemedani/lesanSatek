"use server";

import { AppApi } from "@/lib/api";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";
import { isSecureRequest } from "@/lib/server-action";

export const tempUser = async (
  data: Omit<ReqType["main"]["user"]["tempUser"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["user"]["tempUser"]["get"]>
) => {
  const cookieStore = await cookies();
  const secure = await isSecureRequest();

  try {
    const result = await AppApi().send({
      service: "main",
      model: "user",
      act: "tempUser",
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
          features: 1,
          roles: 1,
        },
      },
    });

    if (result.success && result.body?.token) {
      cookieStore.set("token", result.body.token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ایجاد کاربر موقت" },
    };
  }
};
