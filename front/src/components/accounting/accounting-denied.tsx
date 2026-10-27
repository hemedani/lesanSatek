import Link from "next/link"
import { LockKeyhole, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AccountingContext } from "@/components/accounting/server/context"

const MESSAGES: Record<string, { title: string; description: string }> = {
  unauthenticated: {
    title: "ورود به حساب کاربری",
    description: "برای مشاهده بخش حسابداری باید وارد حساب خود شوید.",
  },
  "no-feature": {
    title: "دسترسی حسابداری فعال نیست",
    description: "ویژگی مشاهده حسابداری برای نقش فعال شما یا واحد مربوطه فعال نشده است.",
  },
  "not-finance": {
    title: "دسترسی به حسابداری مجاز نیست",
    description: "دسترسی حسابداری فقط برای سرپرست واحد مالی (Finance) مجاز است.",
  },
  "no-organization": {
    title: "سازمانی یافت نشد",
    description: "برای نقش فعال شما سازمان قابل دسترسی پیدا نشد. نقش فعال را تغییر دهید یا با مدیر تماس بگیرید.",
  },
}

function AccountingDenied({ context }: { context: AccountingContext }) {
  const message = MESSAGES[context.denial || "no-feature"] || MESSAGES["no-feature"]

  return (
    <div className="glass-card flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-ember/10 ring-1 ring-inset ring-ember/20">
        {context.denial === "unauthenticated" ? (
          <LockKeyhole className="size-6 text-ember" />
        ) : (
          <ShieldAlert className="size-6 text-ember" />
        )}
      </div>
      <h2 className="text-base font-medium text-moonlight">{message.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-fog/70">{message.description}</p>
      {context.denial === "unauthenticated" && (
        <Button render={<Link href="/login" />} className="mt-5">
          ورود به سامانه
        </Button>
      )}
    </div>
  )
}

export { AccountingDenied }
