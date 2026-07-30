"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS, formatCurrency } from "./colors";
import { Layers } from "lucide-react";

interface CategoryConsumption {
  _id: string;
  name: string;
  enName?: string;
  totalQuantity: number;
  count: number;
}

interface Props {
  data: CategoryConsumption[];
}

const CATEGORY_COLORS = [
  CHART_COLORS.iris,
  CHART_COLORS.azure,
  CHART_COLORS.mint,
  CHART_COLORS.ember,
  CHART_COLORS.amber,
  CHART_COLORS.ice,
  CHART_COLORS.frost,
  CHART_COLORS.violet,
];

export function ConsumptionByCategoryPie({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">مصرف به تفکیک نوع کالا</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">داده‌ای موجود نیست</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((c) => ({
    name: c.name,
    value: c.totalQuantity,
    count: c.count,
  }));

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">مصرف به تفکیک نوع کالا</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(47, 52, 62, 0.95)",
                  border: "1px solid rgba(186, 215, 247, 0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value) || 0),
                  String(name),
                ]}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 16, fontSize: "11px" }}
                formatter={(value: string) => (
                  <span style={{ color: "#81899b" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
