"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { AccountSelect } from "@/components/accounting/account-select"
import {
  ACCOUNT_TYPE_OPTIONS,
  NORMAL_BALANCE_OPTIONS,
  SYSTEM_KEY_OPTIONS,
} from "@/components/accounting/labels"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { Account } from "@/components/accounting/types"
import { add } from "@/app/actions/account/add"
import { update } from "@/app/actions/account/update"
import { cn } from "@/lib/utils"

const accountSchema = z.object({
  code: z.string().min(1, "کد حساب الزامی است"),
  name: z.string().min(1, "نام حساب الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  accountType: z.string().min(1, "نوع حساب الزامی است"),
  normalBalance: z.string().min(1, "ماهیت حساب الزامی است"),
  parentAccountId: z.string().optional(),
  systemKey: z.string().optional(),
  isPostable: z.boolean(),
  isActive: z.boolean(),
})

type AccountFormData = z.infer<typeof accountSchema>

interface AccountFormProps {
  organizationId: string
  accounts: Account[]
  initial?: Account
  basePath: string
}

function AccountForm({ organizationId, accounts, initial, basePath }: AccountFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [advanced, setAdvanced] = useState(false)

  const form = useForm<AccountFormData>({
    resolver: zodV4Resolver(accountSchema),
    defaultValues: {
      code: initial?.code || "",
      name: initial?.name || "",
      enName: initial?.enName || "",
      description: initial?.description || "",
      accountType: initial?.accountType || "asset",
      normalBalance: initial?.normalBalance || "debit",
      parentAccountId: initial?.parentAccount?._id || "",
      systemKey: initial?.systemKey || "",
      isPostable: initial?.isPostable ?? true,
      isActive: initial?.isActive ?? true,
    },
  })

  const parentAccounts = accounts.filter((account) => account._id !== initial?._id)

  const onSubmit = async (data: AccountFormData) => {
    setSubmitting(true)
    const payload = {
      code: data.code.trim(),
      name: data.name.trim(),
      ...(data.enName ? { enName: data.enName.trim() } : {}),
      ...(data.description ? { description: data.description.trim() } : {}),
      accountType: data.accountType,
      normalBalance: data.normalBalance,
      ...(data.parentAccountId ? { parentAccountId: data.parentAccountId } : {}),
      ...(data.systemKey ? { systemKey: data.systemKey } : {}),
      isPostable: data.isPostable,
      isActive: data.isActive,
      organizationId,
    }

    const result = initial
      ? await update({ _id: initial._id, ...payload })
      : await add(payload)

    setSubmitting(false)

    if (result.success) {
      toast.success(initial ? "حساب به‌روزرسانی شد" : "حساب ایجاد شد")
      router.push(`${basePath}/accounts`)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در ذخیره حساب"))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput control={form.control} name="code" label="کد حساب" placeholder="۱۱۰۱" required />
        <FormInput control={form.control} name="name" label="نام حساب" placeholder="وجه نقد" required />
        <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="Cash" />
        <FormSelect control={form.control} name="accountType" label="نوع حساب" options={ACCOUNT_TYPE_OPTIONS} required />
        <FormSelect control={form.control} name="normalBalance" label="ماهیت حساب" options={NORMAL_BALANCE_OPTIONS} required />
      </div>

      <FormTextarea control={form.control} name="description" label="توضیحات" rows={3} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-moonlight">حساب والد</p>
        <Controller
          control={form.control}
          name="parentAccountId"
          render={({ field }) => (
            <AccountSelect
              accounts={parentAccounts}
              value={field.value}
              onChange={field.onChange}
              placeholder="بدون حساب والد"
            />
          )}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <FormCheckbox control={form.control} name="isPostable" label="قابل ثبت در سند" />
        <FormCheckbox control={form.control} name="isActive" label="فعال" />
      </div>

      <div className="rounded-xl border border-steel-border/25 bg-white/[0.015]">
        <button
          type="button"
          onClick={() => setAdvanced((value) => !value)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm text-fog outline-none hover:text-moonlight focus-visible:ring-2 focus-visible:ring-electric-iris/50"
          aria-expanded={advanced}
        >
          <span>تنظیمات پیشرفته</span>
          <ChevronDown className={cn("size-4 transition-transform", advanced && "rotate-180")} />
        </button>
        {advanced && (
          <div className="border-t border-steel-border/20 p-4">
            <FormSelect
              control={form.control}
              name="systemKey"
              label="کلید سیستمی"
              placeholder="بدون کلید سیستمی"
              options={SYSTEM_KEY_OPTIONS}
              disabled={!!initial}
            />
            <p className="mt-2 text-xs text-fog/60">
              کلید سیستمی فقط هنگام ایجاد حساب قابل تعیین است و برای حساب‌های سیستمی قفل می‌شود.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {initial ? "ذخیره تغییرات" : "ایجاد حساب"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`${basePath}/accounts`)}>
          انصراف
        </Button>
      </div>
    </form>
  )
}

export { AccountForm }
