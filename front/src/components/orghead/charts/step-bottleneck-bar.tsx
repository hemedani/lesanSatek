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
import { CHART_COLORS } from "./colors";
import { Hourglass } from "lucide-react";

interface StepBottleneck {
  stepName: string;
  stepType: string;
  avgHours: number;
  minHours: number;
  maxHours: number;
  count: number;
}

interface Props {
  data: StepBottleneck[];
}

const BOTTLENECK_COLORS = [
  CHART_COLORS.ember,
  CHART_COLORS.amber,
  CHART_COLORS.azure,
  CHART_COLORS.mint,
  CHART_COLORS.iris,
];

export function StepBottleneckBar({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Hourglass className="size-4 text-frost-link" />
            <CardTitle className="text-sm font-medium text-fog">گلوگاه‌های فرآیند</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-fog/50 py-8 text-center">داده‌ای موجود نیست</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((s) => ({
    name: s.stepName,
    avgHours: Math.round(s.avgHours * 10) / 10,
    minHours: s.minHours,
    maxHours: s.maxHours,
    count: s.count,
  }));

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Hourglass className="size-4 text-frost-link" />
          <CardTitle className="text-sm font-medium text-fog">گلوگاه‌های فرآیند</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 120, right: 32, top: 8, bottom: 8 }}
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
                unit=" ساعت"
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#81899b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={110}
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
                  if (name === "avgHours") return [v.toLocaleString("fa-IR"), "میانگین (ساعت)"];
                  return [v.toLocaleString("fa-IR"), String(name)];
                }}
              />
              <Bar
                dataKey="avgHours"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      BOTTLENECK_COLORS[index % BOTTLENECK_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
