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
import { GitCompare } from "lucide-react";

interface SelectionBreakdown {
  stuff: number;
  tender: number;
  none: number;
}

interface Props {
  data: SelectionBreakdown;
}

const SELECTION_LABELS: Record<string, string> = {
  stuff: "خرید مستقیم",
  tender: "مناقصه",
  none: "تعیین نشده",
};

const SELECTION_COLORS: Record<string, string> = {
  stuff: CHART_COLORS.iris,
  tender: CHART_COLORS.amber,
  none: CHART_COLORS.fog,
};

export function SelectionBreakdownPie({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: SELECTION_LABELS[key] || key,
      value,
      color: SELECTION_COLORS[key] || CHART_COLORS.fog,
    }));

  if (chartData.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <GitCompare className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">نحوه انتخاب</CardTitle>
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
          <GitCompare className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">نحوه انتخاب تأمین</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
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
