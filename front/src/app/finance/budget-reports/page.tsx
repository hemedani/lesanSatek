"use client";

import { useState, useEffect } from "react"
import { Calculator, Wallet, TrendingDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"

interface BudgetLineItem {
  _id: string
  code?: string
  description?: string
  totalAllocated?: number
  remainingBudget?: number
}

const columns = [
  {
    key: "code",
    label: "کد",
    render: (item: BudgetLineItem) => <span className="font-mono font-medium text-moonlight">{item.code || "—"}</span>,
  },
  { key: "description", label: "شرح", render: (item: BudgetLineItem) => item.description || "—" },
  {
    key: "totalAllocated",
    label: "مبلغ کل",
    render: (item: BudgetLineItem) => `${(item.totalAllocated || 0).toLocaleString("fa-IR")} تومان`,
  },
  {
    key: "remainingBudget",
    label: "باقی‌مانده",
    render: (item: BudgetLineItem) => (
      <span className={`font-medium ${(item.remainingBudget || 0) <= 0 ? "text-ember" : "text-emerald-400"}`}>
        {(item.remainingBudget || 0).toLocaleString("fa-IR")} تومان
      </span>
    ),
  },
  {
    key: "consumptionRate",
    label: "نرخ مصرف",
    render: (item: BudgetLineItem) => {
      if (!item.totalAllocated || item.totalAllocated === 0) return "—"
      const rate = ((item.totalAllocated - (item.remainingBudget || 0)) / item.totalAllocated) * 100
      return `${rate.toFixed(1)}%`
    },
  },
]

export default function FinanceBudgetReportsPage() {
  const [items, setItems] = useState<BudgetLineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const result = await getBudgetLines(
        { page: 1, limit: 100 },
        { _id: 1, code: 1, description: 1, totalAllocated: 1, remainingBudget: 1 },
      )
      if (result.success) setItems(result.body || [])
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="گزارش بودجه" description="خلاصه وضعیت بودجه" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} variant="glass">
              <CardContent className="p-6"><Skeleton className="h-24 rounded-lg" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const totalBudget = items.reduce((s: number, i: BudgetLineItem) => s + (i.totalAllocated || 0), 0)
  const totalRemaining = items.reduce((s: number, i: BudgetLineItem) => s + (i.remainingBudget || 0), 0)
  const totalSpent = totalBudget - totalRemaining
  const consumptionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const summaryCards = [
    {
      label: "بودجه کل",
      value: `${totalBudget.toLocaleString("fa-IR")} تومان`,
      icon: Wallet,
      color: "text-electric-iris",
    },
    {
      label: "مصرف شده",
      value: `${totalSpent.toLocaleString("fa-IR")} تومان`,
      icon: TrendingDown,
      color: "text-amber-400",
    },
    {
      label: "باقی‌مانده",
      value: `${totalRemaining.toLocaleString("fa-IR")} تومان`,
      icon: Calculator,
      color: totalRemaining > 0 ? "text-emerald-400" : "text-ember",
    },
    {
      label: "نرخ مصرف",
      value: `${consumptionRate.toFixed(1)}%`,
      icon: FileSpreadsheet,
      color: "text-frost-link",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="گزارش بودجه" description="خلاصه وضعیت بودجه" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg bg-${card.color.replace("text-", "")}/10 ring-1 ring-inset ring-${card.color.replace("text-", "")}/15`}>
                    <Icon className={`size-5 ${card.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-fog leading-5">{card.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-glacier leading-8">{card.value}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-frost-link">تفکیک ردیف‌های بودجه</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={items} keyExtractor={(item: BudgetLineItem) => item._id} />
        </CardContent>
      </Card>
    </div>
  )
}
