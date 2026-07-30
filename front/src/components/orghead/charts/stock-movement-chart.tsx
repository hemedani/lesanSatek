"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, formatCurrency } from "./colors";
import { Activity } from "lucide-react";

interface MovementReason {
  _id: string;
  totalQuantity: number;
  count: number;
}

interface StockMovementSummary {
  totalIn: number;
  totalOut: number;
  byReason: MovementReason[];
}

interface Props {
  data: StockMovementSummary;
}

const REASON_LABELS: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "صدور کالا",
  transfer_in: "انتقال (ورود)",
  transfer_out: "انتقال (خروج)",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "برگشت",
  write_off: "انهدام",
};

export function StockMovementChart({ data }: Props) {
  if (!data || !data.byReason || data.byReason.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">گردش کالا</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">داده‌ای موجود نیست</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.byReason
    .filter((r) => r.totalQuantity !== 0)
    .map((r) => ({
      name: REASON_LABELS[r._id] || r._id,
      value: Math.abs(r.totalQuantity),
      isIn: r.totalQuantity > 0,
      count: r.count,
    }));

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">گردش کالا</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-[10px] text-fog/50">ورودی کل</p>
            <p className="text-lg font-semibold text-emerald-400" dir="ltr">
              {formatCurrency(data.totalIn)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-fog/50">خروجی کل</p>
            <p className="text-lg font-semibold text-ember" dir="ltr">
              {formatCurrency(data.totalOut)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-fog/50">خالص</p>
            <p
              className={`text-lg font-semibold ${
                data.totalIn - data.totalOut >= 0
                  ? "text-emerald-400"
                  : "text-ember"
              }`}
              dir="ltr"
            >
              {formatCurrency(data.totalIn - data.totalOut)}
            </p>
          </div>
        </div>
        {chartData.length > 0 && (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 130, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(186,215,247,0.06)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#81899b", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(186,215,247,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#81899b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                  tickMargin={4}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(47, 52, 62, 0.95)",
                    border: "1px solid rgba(186, 215, 247, 0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, _name, props) => {
                    const payload = props?.payload as { isIn?: boolean } | undefined;
                    const v = Number(value) || 0;
                    return [formatCurrency(v), payload?.isIn ? "ورود" : "خروج"];
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.isIn ? CHART_COLORS.emerald : CHART_COLORS.ember}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
