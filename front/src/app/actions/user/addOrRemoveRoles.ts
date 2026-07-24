"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const addOrRemoveRoles = async (
  data: Omit<ReqType["main"]["user"]["addOrRemoveRoles"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["user"]["addOrRemoveRoles"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "addOrRemoveRoles",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {
          _id: 1,
          first_name: 1,
          last_name: 1,
          roles: 1,
          units: { _id: 1, name: 1 },
          organizations: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در مدیریت نقش‌ها" },
    };
  }
};
