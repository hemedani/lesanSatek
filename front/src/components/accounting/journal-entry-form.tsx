"use client"

import { useId, useMemo, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { JournalLinesEditor, emptyLine, type JournalEntryFormValues } from "@/components/accounting/journal-lines-editor"
import { isBalanced, parseAmount } from "@/components/accounting/money"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { Account, CostCenter, JournalEntry } from "@/components/accounting/types"
import { firstItem } from "@/components/accounting/types"
import { postManual } from "@/app/actions/journalEntry/postManual"

const lineSchema = z.object({
  accountId: z.string().optional(),
  systemKey: z.string().optional(),
  description: z.string().optional(),
  debit: z.string().optional(),
  credit: z.string().optional(),
  costCenterId: z.string().optional(),
  unitId: z.string().optional(),
})

const entrySchema = z
  .object({
    entryDate: z.string().min(1, "تاریخ سند الزامی است"),
    description: z.string().optional(),
    reference: z.string().optional(),
    lines: z.array(lineSchema).min(2, "سند باید حداقل دو ردیف داشته باشد"),
  })
  .superRefine((value, ctx) => {
    value.lines.forEach((line, index) => {
      const debit = parseAmount(line.debit || "")
      const credit = parseAmount(line.credit || "")
      const hasDebit = debit > 0
      const hasCredit = credit > 0
      if (!line.accountId && !line.systemKey) {
        ctx.addIssue({
          code: "custom",
          path: ["lines", index, "accountId"],
          message: "حساب یا کلید سیستمی الزامی است",
        })
      }
      if (hasDebit === hasCredit) {
        ctx.addIssue({
          code: "custom",
          path: ["lines", index, "debit"],
          message: "فقط یکی از بدهکار یا بستانکار باید مقدار داشته باشد",
        })
      }
    })

    const totals = value.lines.reduce(
      (acc, line) => {
        acc.debit += parseAmount(line.debit || "")
        acc.credit += parseAmount(line.credit || "")
        return acc
      },
      { debit: 0, credit: 0 },
    )
    if (!isBalanced(totals.debit, totals.credit)) {
      ctx.addIssue({
        code: "custom",
        path: ["lines"],
        message: "جمع بدهکار و بستانکار باید برابر باشد",
      })
    }
  })

interface JournalEntryFormProps {
  organizationId: string
  accounts: Account[]
  costCenters: CostCenter[]
  units: { _id: string; name?: string }[]
  basePath: string
  canPostManual: boolean
}

function JournalEntryForm({
  organizationId,
  accounts,
  costCenters,
  units,
  basePath,
  canPostManual,
}: JournalEntryFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formId = useId()
  const idempotencyKey = `manual-${formId}`

  const defaultDate = useMemo(() => new Date().toISOString(), [])

  const form = useForm<JournalEntryFormValues>({
    resolver: zodV4Resolver(entrySchema) as unknown as Resolver<JournalEntryFormValues>,
    defaultValues: {
      entryDate: defaultDate,
      description: "",
      reference: "",
      lines: [
        { ...emptyLine },
        { ...emptyLine },
      ],
    },
  })

  const onSubmit = async (data: JournalEntryFormValues) => {
    if (!canPostManual) {
      toast.error("شما دسترسی ثبت سند دستی را ندارید.")
      return
    }
    setSubmitting(true)
    setFormError(null)
    const result = await postManual({
      organizationId,
      entryDate: data.entryDate,
      ...(data.description ? { description: data.description.trim() } : {}),
      ...(data.reference ? { reference: data.reference.trim() } : {}),
      idempotencyKey,
      lines: data.lines.map((line) => ({
        ...(line.accountId ? { accountId: line.accountId } : {}),
        ...(line.systemKey ? { systemKey: line.systemKey } : {}),
        ...(line.description ? { description: line.description } : {}),
        ...(parseAmount(line.debit || "") ? { debit: parseAmount(line.debit) } : {}),
        ...(parseAmount(line.credit || "") ? { credit: parseAmount(line.credit) } : {}),
        ...(line.costCenterId ? { costCenterId: line.costCenterId } : {}),
        ...(line.unitId ? { unitId: line.unitId } : {}),
      })),
    })
    setSubmitting(false)

    if (result.success) {
      const entry = firstItem<JournalEntry>(result.body)
      toast.success("سند دستی با موفقیت ثبت شد")
      if (entry?._id) {
        router.push(`${basePath}/journal-entries/${entry._id}`)
      } else {
        router.push(`${basePath}/journal-entries`)
      }
      router.refresh()
    } else {
      const message = resolveAccountingError(result.body?.message, "خطا در ثبت سند دستی")
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => setFormError("اطلاعات سند کامل یا تراز نیست."))}
        className="space-y-7"
      >
        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-ember/25 bg-ember/10 px-4 py-3 text-sm text-ember">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormJalaliDatePicker control={form.control} name="entryDate" label="تاریخ سند" required />
          <FormInput control={form.control} name="reference" label="شماره مرجع" placeholder="اختیاری" />
        </div>
        <FormTextarea control={form.control} name="description" label="شرح سند" rows={3} />

        <JournalLinesEditor
          control={form.control}
          accounts={accounts}
          costCenters={costCenters}
          units={units}
          disabled={submitting}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting || !canPostManual} className="gap-2">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            ثبت سند
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(`${basePath}/journal-entries`)}>
            انصراف
          </Button>
        </div>
      </form>
    </Form>
  )
}

export { JournalEntryForm }
