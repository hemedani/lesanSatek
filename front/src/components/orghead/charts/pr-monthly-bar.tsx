"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTH_NAMES, formatCurrency } from "./colors";
import { TrendingUp } from "lucide-react";

interface MonthlyData {
  year: number;
  month: number;
  count: number;
  totalEstimatedAmount: number;
}

interface Props {
  data: MonthlyData[];
}

export function PrMonthlyBar({ data }: Props) {
  const now = new Date();
  const allMonths: { key: string; label: string; count: number; amount: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = data.find(
      (m) => m.year === d.getFullYear() && m.month === d.getMonth() + 1
    );
    allMonths.push({
      key,
      label: MONTH_NAMES[d.getMonth()],
      count: existing?.count ?? 0,
      amount: existing?.totalEstimatedAmount ?? 0,
    });
  }

  if (allMonths.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">روند ماهانه درخواست‌ها</CardTitle>
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
          <TrendingUp className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">روند ماهانه درخواست‌ها</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allMonths} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
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
                  if (name === "count") return [formatCurrency(v), "تعداد"];
                  return [formatCurrency(v), "مبلغ (ریال)"];
                }}
              />
              <Bar
                dataKey="count"
                fill="#663af3"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
