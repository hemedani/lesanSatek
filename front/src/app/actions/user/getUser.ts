"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getUser = async (
  data: ReqType["main"]["user"]["getUser"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["getUser"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "getUser",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {
          _id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          mobile: 1,
          isActive: 1,
          position: 1,
          roles: 1,
          features: 1,
          organization: { _id: 1, name: 1 },
          avatar: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت کاربر" },
    };
  }
};
