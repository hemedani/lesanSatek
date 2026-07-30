"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { DeepPartial, ReqType } from "@/types/declarations/selectInp";

export const getOrgChart = async (
  data: { orgId?: string; activeRoleId?: string } = {},
  getSelection?: DeepPartial<ReqType["main"]["unit"]["getOrgChart"]["get"]>,
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "unit",
      act: "getOrgChart",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { units: 1 as const },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت اطلاعات نمودار سازمانی" },
    };
  }
};
