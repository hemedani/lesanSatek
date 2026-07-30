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
import { CHART_COLORS, formatCurrency } from "./colors";
import { Store } from "lucide-react";

interface StoreProcurement {
  _id: string;
  storeName: string;
  totalPRs: number;
  totalEstimatedAmount: number;
}

interface Props {
  data: StoreProcurement[];
}

export function ProcurementByStoreBar({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">خرید از فروشگاه‌ها</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">داده‌ای موجود نیست</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((s) => ({
    name: s.storeName,
    amount: s.totalEstimatedAmount,
    count: s.totalPRs,
  }));

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Store className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">خرید از فروشگاه‌ها</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 140, right: 16, top: 8, bottom: 8 }}
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
                width={130}
                tickMargin={4}
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
                  if (name === "amount") return [formatCurrency(v), "ریال"];
                  return [formatCurrency(v), "تعداد درخواست"];
                }}
              />
              <Bar
                dataKey="amount"
                fill={CHART_COLORS.amber}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
