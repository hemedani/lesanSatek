import { cookies } from "next/headers";

import { ACTIVE_ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/session-cookies";

export const getToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
};

export const getActiveRoleId = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ROLE_COOKIE)?.value || "";
};
