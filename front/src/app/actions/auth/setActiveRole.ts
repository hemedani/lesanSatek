"use server";

import { cookies } from "next/headers";

import { getPanelForRole } from "@/lib/roles";
import { isSecureRequest } from "@/lib/server-action";
import { ACTIVE_ROLE_COOKIE, SESSION_MAX_AGE } from "@/lib/session-cookies";

export const setActiveRole = async (roleId: string, roleName: string) => {
  try {
    const cookieStore = await cookies();
    const secure = await isSecureRequest();
    cookieStore.set(ACTIVE_ROLE_COOKIE, roleId, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    const targetPanel = getPanelForRole(roleName) || "/admin";

    return { success: true, body: { activeRoleId: roleId, targetPanel } };
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تنظیم نقش فعال" },
    };
  }
};
