const AUTHORIZATION_ERROR_MESSAGES: Record<string, string> = {
  "you cant do this": "شما مجاز به انجام این عملیات نیستید.",
  "active role not found": "نقش فعال یافت نشد. لطفاً نقش خود را دوباره انتخاب کنید.",
  "activeroleid is required": "نقش فعال مشخص نشده است. لطفاً نقش خود را دوباره انتخاب کنید.",
};

export function resolveActionErrorMessage(
  message: string | undefined,
  fallback: string,
): string {
  const raw = (message || "").trim();
  if (!raw) return fallback;
  return AUTHORIZATION_ERROR_MESSAGES[raw.toLowerCase()] || raw;
}
