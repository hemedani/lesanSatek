"use server";

import { cookies } from "next/headers";

export const setActiveRole = async (roleId: string) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set("activeRoleId", roleId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const { getUser } = await import("@/app/actions/user/getUser");
    const userRes = await getUser({}, { roles: { name: 1 } });
    let targetPanel = "/admin";

    if (userRes.success && userRes.body) {
      const user = userRes.body;
      const role = user.roles?.find((r: { roleId?: string }) => r.roleId === roleId || r.roleId === undefined);
      if (role) {
        const { getPanelForRole } = await import("@/lib/roles");
        const panel = getPanelForRole(role.name);
        if (panel) targetPanel = panel;
      }
    }

    return { success: true, body: { activeRoleId: roleId, targetPanel } };
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تنظیم نقش فعال" },
    };
  }
};
