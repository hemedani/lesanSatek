"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  _id: string;
  quantity: number;
  minQuantity: number;
  ware: { _id: string; name: string };
  unit: { _id: string; name: string };
  wareModel: { _id: string; name: string };
}

interface InventoryLowStock {
  count: number;
  items: LowStockItem[];
}

interface Props {
  data: InventoryLowStock;
}

function getSeverity(qty: number, minQty: number): { label: string; color: string; bg: string } {
  const ratio = qty / minQty;
  if (ratio <= 0.25) return { label: "بحرانی", color: "text-rose-400", bg: "bg-rose-500/10" };
  if (ratio <= 0.5) return { label: "شدید", color: "text-ember", bg: "bg-ember/10" };
  if (ratio <= 0.75) return { label: "هشدار", color: "text-amber-400", bg: "bg-amber-400/10" };
  return { label: "توجه", color: "text-fog", bg: "bg-white/[0.03]" };
}

export function InventoryLowStock({ data }: Props) {
  if (!data || data.items.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">کالاهای کم‌موجودی</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10">
              <AlertTriangle className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">همه کالاها در سطح مجاز</p>
              <p className="text-xs text-fog/50">هیچ کالایی کم‌موجودی ندارد</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">کالاهای کم‌موجودی</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-ember/10 text-ember border-ember/20">
            {data.count} کالا
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.items.map((item) => {
          const severity = getSeverity(item.quantity, item.minQuantity);
          return (
            <div
              key={item._id}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-steel-border/10"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${severity.bg} shrink-0`}
              >
                <AlertTriangle className={`size-4 ${severity.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-moonlight truncate leading-5">
                  {item.ware?.name || item.wareModel?.name || "—"}
                </p>
                <p className="text-[10px] text-fog/50 truncate">
                  {item.unit?.name || ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-glacier" dir="ltr">
                  {item.quantity}
                </p>
                <p className="text-[10px] text-fog/40">
                  حداقل: {item.minQuantity}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 ${severity.bg} ${severity.color} border-none`}
              >
                {severity.label}
              </Badge>
            </div>
          );
        })}
        {data.count > data.items.length && (
          <p className="text-[10px] text-fog/40 text-center pt-1">
            + {data.count - data.items.length} کالای دیگر
          </p>
        )}
      </CardContent>
    </Card>
  );
}
