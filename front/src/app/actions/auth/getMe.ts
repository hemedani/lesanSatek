"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";
import { getHighestRole } from "@/lib/roles";
import { isSecureRequest } from "@/lib/server-action";

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
          organizations: { _id: 1, name: 1 },
          avatar: { _id: 1, name: 1 },
          units: { _id: 1, name: 1 },
          managedStore: { _id: 1, name: 1 },
        },
      },
    });

    if (result.success && result.body) {
      const cookieStore = await cookies();
      const secure = await isSecureRequest();
      const currentActiveRoleId = cookieStore.get("activeRoleId")?.value;
      const currentRoleName = cookieStore.get("roleName")?.value;
      if (result.body.roles?.length > 0) {
        const activeRole = result.body.roles.find(
          (r: { roleId: string }) => r.roleId === currentActiveRoleId
        );
        if (!currentActiveRoleId || !activeRole) {
          const highest = getHighestRole(result.body.roles);
          const selected = highest || result.body.roles[0];
          cookieStore.set("activeRoleId", selected.roleId, {
            httpOnly: false,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
          cookieStore.set("roleName", selected.name, {
            httpOnly: false,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
        } else if (currentRoleName !== activeRole.name) {
          cookieStore.set("roleName", activeRole.name, {
            httpOnly: false,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          });
        }
      }
    }

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت اطلاعات کاربر" },
    };
  }
};
