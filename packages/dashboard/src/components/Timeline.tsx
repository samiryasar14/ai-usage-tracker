import ReactECharts from "echarts-for-react";
import type { TimelineDay } from "../api";
import { formatCompact, formatCurrency } from "../format";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface TimelineProps {
  data: TimelineDay[];
}

export function Timeline({ data }: TimelineProps) {
  const seriesColor = cssVar("--series-1") || "#2a78d6";
  const mutedColor = cssVar("--text-muted") || "#898781";
  const hairlineColor = cssVar("--hairline") || "#e1e0d9";
  const primaryInk = cssVar("--text-primary") || "#0b0b0b";
  const surfaceColor = cssVar("--surface-1") || "#fcfcfb";

  const option = {
    grid: { left: 56, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: "category",
      data: data.map((d) => d.day.slice(5)), // MM-DD
      axisLine: { lineStyle: { color: hairlineColor } },
      axisTick: { show: false },
      axisLabel: { color: mutedColor, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: mutedColor, fontSize: 11, formatter: (v: number) => formatCompact(v) },
      splitLine: { lineStyle: { color: hairlineColor, type: "solid" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: surfaceColor,
      borderColor: hairlineColor,
      textStyle: { color: primaryInk },
      formatter: (params: unknown) => {
        const p = (params as Array<{ dataIndex: number }>)[0];
        const day = data[p.dataIndex];
        return [
          `<strong>${day.day}</strong>`,
          `Tokens: ${formatCompact(day.tokens)}`,
          `Requests: ${day.requests}`,
          `Cost: ${formatCurrency(day.cost)}`,
        ].join("<br/>");
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.tokens),
        barMaxWidth: 24,
        itemStyle: {
          color: seriesColor,
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 12,
          shadowColor: seriesColor,
          shadowOffsetY: 2,
        },
        emphasis: {
          itemStyle: { shadowBlur: 20, shadowColor: seriesColor },
        },
      },
    ],
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-hairline text-sm text-text-muted">
        No usage data yet.
      </div>
    );
  }

  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}
