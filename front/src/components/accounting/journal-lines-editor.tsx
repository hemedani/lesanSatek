"use client"

import { Controller, useFieldArray, useFormContext, useWatch, type Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AccountSelect } from "@/components/accounting/account-select"
import { formatRial, isBalanced, parseAmount } from "@/components/accounting/money"
import type { Account, CostCenter } from "@/components/accounting/types"
import { cn } from "@/lib/utils"

export interface JournalLineFormValue {
  accountId: string
  systemKey: string
  description: string
  debit: string
  credit: string
  costCenterId: string
  unitId: string
}

export interface JournalEntryFormValues {
  entryDate: string
  description: string
  reference: string
  lines: JournalLineFormValue[]
}

interface JournalLinesEditorProps {
  control: Control<JournalEntryFormValues>
  accounts: Account[]
  costCenters: CostCenter[]
  units: { _id: string; name?: string }[]
  disabled?: boolean
}

const emptyLine: JournalLineFormValue = {
  accountId: "",
  systemKey: "",
  description: "",
  debit: "",
  credit: "",
  costCenterId: "",
  unitId: "",
}

function JournalLinesEditor({
  control,
  accounts,
  costCenters,
  units,
  disabled,
}: JournalLinesEditorProps) {
  const { setValue } = useFormContext<JournalEntryFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: "lines" })
  const lines = useWatch({ control, name: "lines" }) || []

  const totals = lines.reduce(
    (acc, line) => {
      acc.debit += parseAmount(line.debit || "")
      acc.credit += parseAmount(line.credit || "")
      return acc
    },
    { debit: 0, credit: 0 },
  )
  const balanced = isBalanced(totals.debit, totals.credit)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-steel-border/25">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.7fr_1.2fr_0.8fr_0.8fr_1fr_1fr_2.5rem] gap-2 border-b border-steel-border/25 bg-white/[0.02] px-3 py-2 text-xs text-fog/70">
            <span>حساب</span>
            <span>شرح ردیف</span>
            <span>بدهکار</span>
            <span>بستانکار</span>
            <span>مرکز هزینه</span>
            <span>واحد</span>
            <span />
          </div>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1.7fr_1.2fr_0.8fr_0.8fr_1fr_1fr_2.5rem] gap-2 border-b border-steel-border/10 px-3 py-2.5 last:border-b-0"
            >
              <Controller
                control={control}
                name={`lines.${index}.accountId`}
                render={({ field: accountField }) => (
                  <AccountSelect
                    accounts={accounts}
                    value={accountField.value}
                    onChange={accountField.onChange}
                    placeholder="حساب قابل ثبت…"
                    disabled={disabled}
                    postableOnly
                  />
                )}
              />
              <Controller
                control={control}
                name={`lines.${index}.description`}
                render={({ field: descriptionField }) => (
                  <Input
                    value={descriptionField.value || ""}
                    onChange={descriptionField.onChange}
                    placeholder="شرح"
                    disabled={disabled}
                    className="h-10"
                  />
                )}
              />
              <Controller
                control={control}
                name={`lines.${index}.debit`}
                render={({ field: debitField }) => (
                  <Input
                    value={debitField.value || ""}
                    onChange={(event) => {
                      const value = event.target.value
                      debitField.onChange(value)
                      if (value) setValue(`lines.${index}.credit`, "", { shouldValidate: true })
                    }}
                    inputMode="numeric"
                    placeholder="۰"
                    dir="ltr"
                    disabled={disabled}
                    className="h-10 text-end font-mono"
                  />
                )}
              />
              <Controller
                control={control}
                name={`lines.${index}.credit`}
                render={({ field: creditField }) => (
                  <Input
                    value={creditField.value || ""}
                    onChange={(event) => {
                      const value = event.target.value
                      creditField.onChange(value)
                      if (value) setValue(`lines.${index}.debit`, "", { shouldValidate: true })
                    }}
                    inputMode="numeric"
                    placeholder="۰"
                    dir="ltr"
                    disabled={disabled}
                    className="h-10 text-end font-mono"
                  />
                )}
              />
              <Controller
                control={control}
                name={`lines.${index}.costCenterId`}
                render={({ field: costField }) => (
                  <Select value={costField.value} onValueChange={costField.onChange} disabled={disabled}>
                    <SelectTrigger className="w-full" dir="rtl">
                      <SelectValue placeholder="اختیاری" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {costCenters.map((costCenter) => (
                        <SelectItem key={costCenter._id} value={costCenter._id}>
                          {costCenter.name || costCenter.code || costCenter._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                control={control}
                name={`lines.${index}.unitId`}
                render={({ field: unitField }) => (
                  <Select value={unitField.value} onValueChange={unitField.onChange} disabled={disabled}>
                    <SelectTrigger className="w-full" dir="rtl">
                      <SelectValue placeholder="اختیاری" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {units.map((unit) => (
                        <SelectItem key={unit._id} value={unit._id}>
                          {unit.name || unit._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || fields.length <= 2}
                onClick={() => remove(index)}
                className="text-fog/60 hover:bg-ember/5 hover:text-ember"
                aria-label="حذف ردیف"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ ...emptyLine })}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="size-4" />
          افزودن ردیف
        </Button>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-fog">
            جمع بدهکار: <strong className="text-moonlight tabular-nums">{formatRial(totals.debit)}</strong>
          </span>
          <span className="text-fog">
            جمع بستانکار: <strong className="text-moonlight tabular-nums">{formatRial(totals.credit)}</strong>
          </span>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              balanced
                ? "border-cipher-mint/25 bg-cipher-mint/10 text-cipher-mint"
                : "border-ember/25 bg-ember/10 text-ember",
            )}
          >
            {balanced ? "سند تراز است" : "سند تراز نیست"}
          </span>
        </div>
      </div>
    </div>
  )
}

export { JournalLinesEditor, emptyLine }
