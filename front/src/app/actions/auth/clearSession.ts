"use server";

import { cookies } from "next/headers";

import {
  ACTIVE_ROLE_COOKIE,
  ROLE_NAME_COOKIE,
  TOKEN_COOKIE,
} from "@/lib/session-cookies";

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  cookieStore.delete(ACTIVE_ROLE_COOKIE);
  cookieStore.delete(ROLE_NAME_COOKIE);
  return { success: true };
};
