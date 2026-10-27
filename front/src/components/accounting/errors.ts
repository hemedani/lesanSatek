const DEFAULT_FALLBACK = "خطا در انجام عملیات حسابداری"

export function resolveAccountingError(
  message: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
): string {
  const raw = (message || "").trim()
  if (!raw) return fallback

  const lower = raw.toLowerCase()

  if (lower.includes("journal entry is not balanced")) {
    return "سند تراز نیست؛ جمع بدهکار و بستانکار باید برابر باشد."
  }
  if (
    lower.includes("accounting period") &&
    (lower.includes("closed") || lower.includes("locked"))
  ) {
    return "دوره حسابداری بسته یا قفل است و امکان ثبت در آن وجود ندارد."
  }
  if (lower.includes("account is inactive")) {
    return "حساب انتخاب‌شده غیرفعال است."
  }
  if (lower.includes("account is a header account")) {
    return "حساب کل/گروهی قابل ثبت نیست؛ یک حساب قابل ثبت انتخاب کنید."
  }
  if (lower.includes("no active account mapped")) {
    return "حساب پیش‌فرض برای این نوع عملیات تعریف نشده است."
  }
  if (lower.includes("system accounts cannot be deleted")) {
    return "حساب‌های سیستمی قابل حذف نیستند."
  }
  if (lower.includes("delete child accounts first")) {
    return "ابتدا حساب‌های زیرمجموعه را حذف کنید."
  }
  if (lower.includes("account has journal entries")) {
    return "این حساب در اسناد استفاده شده و قابل حذف نیست."
  }
  if (lower.includes("cost center has journal entries")) {
    return "این مرکز هزینه در اسناد استفاده شده و قابل حذف نیست."
  }
  if (
    lower.includes("period has journal entries") &&
    lower.includes("cannot be deleted")
  ) {
    return "این دوره سند دارد و قابل حذف نیست."
  }
  if (lower.includes("closed or locked periods cannot be deleted")) {
    return "دوره بسته یا قفل‌شده قابل حذف نیست."
  }
  if (lower.includes("resolve draft journal entries")) {
    return "ابتدا اسناد پیش‌نویس این دوره را تعیین تکلیف کنید."
  }
  if (
    lower.includes("only the head of a finance unit") ||
    lower.includes("finance unit")
  ) {
    return "دسترسی حسابداری فقط برای سرپرست واحد مالی مجاز است."
  }
  if (
    lower === "you cant do this" ||
    lower === "you can't do this" ||
    lower.includes("you cant do this")
  ) {
    return "شما دسترسی لازم برای این عملیات را ندارید."
  }
  if (
    lower.includes("active role not found") ||
    lower.includes("activeroleid is required")
  ) {
    return "نقش فعال معتبر نیست؛ دوباره وارد شوید یا نقش را تغییر دهید."
  }

  return raw
}
