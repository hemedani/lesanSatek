"use server";

import { AppApi } from "@/lib/api";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";
import { getHighestRole } from "@/lib/roles";
import { isSecureRequest } from "@/lib/server-action";
import {
  ACTIVE_ROLE_COOKIE,
  ROLE_NAME_COOKIE,
  SESSION_MAX_AGE,
  TOKEN_COOKIE,
} from "@/lib/session-cookies";

export const login = async (
  data: Omit<ReqType["main"]["user"]["login"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["user"]["login"]["get"]>
) => {
  const cookieStore = await cookies();
  const secure = await isSecureRequest();

  try {
    const result = await AppApi().send({
      service: "main",
      model: "user",
      act: "login",
      details: {
        set: data,
        get: getSelection || {
          token: 1,
          user: {
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
            units: { _id: 1, name: 1 },
            avatar: { _id: 1, name: 1 },
          },
        },
      },
    });

    if (result.success && result.body?.token) {
      cookieStore.set(TOKEN_COOKIE, result.body.token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });

      if (result.body.user?.roles?.length > 0) {
        const highest = getHighestRole(result.body.user.roles);
        const selectedRole = highest || result.body.user.roles[0];
        cookieStore.set(ACTIVE_ROLE_COOKIE, selectedRole.roleId, {
          httpOnly: false,
          secure,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
        cookieStore.set(ROLE_NAME_COOKIE, selectedRole.name, {
          httpOnly: false,
          secure,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
      }
    }

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ورود به سامانه" },
    };
  }
};
