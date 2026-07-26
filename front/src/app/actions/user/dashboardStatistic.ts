"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const dashboardStatistic = async (
  data: Omit<ReqType["main"]["user"]["dashboardStatistic"]["set"], "activeRoleId">,
  getSelection?: DeepPartial<ReqType["main"]["user"]["dashboardStatistic"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "dashboardStatistic",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {},
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت آمار داشبورد" },
    };
  }
};
