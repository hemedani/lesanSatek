"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDownUp } from "lucide-react"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"

const options: FilterOption[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "sent_to_finance", label: "ارسال به مالی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "cancelled", label: "لغو شده" },
]

interface PaymentOrdersFilterProps {
  value: string
  defaultStatus?: string
}

function PaymentOrdersFilter({ value, defaultStatus = "sent_to_finance" }: PaymentOrdersFilterProps) {
  const router = useRouter()
  const params = useSearchParams()

  const handleChange = (next: string | null) => {
    const q = new URLSearchParams(params.toString())
    if (next && next !== defaultStatus) q.set("status", next)
    else q.delete("status")
    q.delete("page")
    router.push(`/unit-head/finance/payment-orders?${q.toString()}`)
  }

  return (
    <FilterSelect
      icon={ArrowDownUp}
      placeholder="وضعیت دستور پرداخت"
      ariaLabel="فیلتر وضعیت دستور پرداخت"
      value={value}
      onValueChange={handleChange}
      options={options}
    />
  )
}

export { PaymentOrdersFilter }