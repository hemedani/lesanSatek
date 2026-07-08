"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getUsers = async (
  data: ReqType["main"]["user"]["getUsers"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["getUsers"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "getUsers",
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
          organization: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست کاربران" },
    };
  }
};
