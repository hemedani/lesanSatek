"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";

interface StockMovement {
  _id: string;
  quantity?: number;
  reason?: string;
  description?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string };
  createdBy?: { _id: string; first_name?: string };
  wareModel?: { _id: string; name?: string };
}

interface StockMovementsClientProps {
  items: StockMovement[];
}

const reasonLabels: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "خروج کالا",
  transfer_in: "انتقال (ورودی)",
  transfer_out: "انتقال (خروجی)",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "برگشت",
  write_off: "حذف",
};

export function StockMovementsClient({ items }: StockMovementsClientProps) {
  const [cardView, setCardView] = useState(true);

  const columns: Column<StockMovement>[] = [
    {
      key: "wareModel",
      label: "مدل کالا",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Activity className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.wareModel?.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "تعداد",
      render: (item) => (
        <span className="font-mono text-sm" dir="ltr">
          {item.quantity != null ? (
            <span className={item.quantity > 0 ? "text-emerald-400" : "text-rose-400"}>
              {item.quantity > 0 ? "+" : ""}{item.quantity.toLocaleString("fa-IR")}
            </span>
          ) : "—"}
        </span>
      ),
    },
    {
      key: "reason",
      label: "نوع حرکت",
      render: (item) => (
        <span className="text-fog text-sm">{reasonLabels[item.reason || ""] || item.reason || "—"}</span>
      ),
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => (
        <span className="text-fog text-sm">{item.unit?.name || "—"}</span>
      ),
    },
    {
      key: "createdBy",
      label: "ثبت‌کننده",
      render: (item) => (
        <span className="text-fog text-sm">{item.createdBy?.first_name || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={cardView}
      onViewToggle={() => setCardView((v) => !v)}
      renderCard={(item) => (
        <div className="glass-card glass-card-hover-active rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                <Activity className="size-5 text-electric-iris" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-moonlight leading-6 truncate">{item.wareModel?.name || "—"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono" dir="ltr">
                    <span className={item.quantity != null && item.quantity > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {item.quantity != null ? `${item.quantity > 0 ? "+" : ""}${item.quantity.toLocaleString("fa-IR")}` : "—"}
                    </span>
                  </span>
                  <span className="text-xs text-fog/50">{reasonLabels[item.reason || ""] || item.reason || ""}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-fog/40">
            {item.unit?.name && <span>{item.unit.name}</span>}
            {item.createdBy?.first_name && <span>{item.createdBy.first_name}</span>}
          </div>
          {item.description && (
            <p className="text-xs text-fog/50 mt-1">{item.description}</p>
          )}
        </div>
      )}
      emptyTitle="حرکتی یافت نشد"
      emptyDescription="هنوز هیچ گردش کالایی ثبت نشده است."
    />
  );
}
