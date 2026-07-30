"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTH_NAMES, CHART_COLORS, formatCurrency } from "./colors";
import { TrendingDown } from "lucide-react";

interface ConsumptionMonth {
  year: number;
  month: number;
  totalQuantity: number;
  count: number;
}

interface Props {
  data: ConsumptionMonth[];
}

export function ConsumptionTrendArea({ data }: Props) {
  const now = new Date();
  const allMonths: { label: string; quantity: number; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const existing = data.find(
      (m) => m.year === d.getFullYear() && m.month === d.getMonth() + 1
    );
    allMonths.push({
      label: MONTH_NAMES[d.getMonth()],
      quantity: existing?.totalQuantity ?? 0,
      count: existing?.count ?? 0,
    });
  }

  if (allMonths.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">روند مصرف ماهانه</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">داده‌ای موجود نیست</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">روند مصرف ماهانه</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={allMonths} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
              <defs>
                <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.azure} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.azure} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(186,215,247,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#81899b", fontSize: 10 }}
                axisLine={{ stroke: "rgba(186,215,247,0.1)" }}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "#81899b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(47, 52, 62, 0.95)",
                  border: "1px solid rgba(186, 215, 247, 0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => {
                  const v = Number(value) || 0
                  if (name === "quantity") return [formatCurrency(v), "مقدار"];
                  return [formatCurrency(v), "تعداد"];
                }}
              />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke={CHART_COLORS.azure}
                fill="url(#consumptionGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
