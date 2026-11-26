//
// Created by HuyN on 2026/11/26.
// Description: Thành phần biểu đồ đường SVG hiển thị biến thiên thông số cảm biến theo thời gian thực,
// hỗ trợ tương tác di chuột và giao diện Xanh biển tối.
//

"use client";

import React, { useState } from "react";
import { SensorReading } from "@/types/telemetry";

interface TelemetryChartProps {
    readings: SensorReading[];
    metricKey: string;
    unit: string;
    label: string;
    isDark?: boolean;
}

export function TelemetryChart({
                                   readings,
                                   metricKey,
                                   unit,
                                   label,
                                   isDark = false,
                               }: TelemetryChartProps) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const validPoints = readings
        .filter((r) => typeof r.metrics?.[metricKey] === "number")
        .map((r) => ({
            timestamp: r.timestamp,
            value: r.metrics[metricKey],
        }));

    if (validPoints.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed theme-border rounded-lg subtle-bg text-muted text-sm">
                <p>Chưa có dữ liệu lịch sử cho thông số {label}.</p>
                <p className="text-xs mt-1">Biểu đồ sẽ tự động vẽ ngay khi thiết bị gửi gói tin đầu tiên.</p>
            </div>
        );
    }

    const width = 720;
    const height = 240;
    const padLeft = 52;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 32;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const values = validPoints.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const margin = rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.15;
    const minVal = rawMin - margin;
    const maxVal = rawMax + margin;

    const getX = (index: number) => {
        if (validPoints.length === 1) return padLeft + plotW / 2;
        return padLeft + (index / (validPoints.length - 1)) * plotW;
    };

    const getY = (val: number) => {
        return padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
    };

    const linePath = validPoints
        .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(pt.value).toFixed(1)}`)
        .join(" ");

    const areaPath = `${linePath} L ${getX(validPoints.length - 1).toFixed(1)} ${(
        padTop + plotH
    ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minVal + t * (maxVal - minVal));
    const activePoint =
        hoverIndex !== null ? validPoints[hoverIndex] : validPoints[validPoints.length - 1];

    const strokeColor = isDark ? "#38BDF8" : "#12372A";
    const gridColor = isDark ? "#1E3A52" : "#E4EBE7";
    const pointBorder = isDark ? "#0D1E2E" : "#FFFFFF";
    const formatVal = (v: number) =>
        metricKey === "lux" || metricKey === "co2_ppm" ? v.toFixed(0) : v.toFixed(1);

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-main font-mono tabular-nums">
            {formatVal(activePoint.value)}
          </span>
                    <span className="text-sm font-medium text-muted">{unit}</span>
                </div>
                <span className="text-xs font-mono text-muted tabular-nums">
          Mốc thời gian: {activePoint.timestamp}
        </span>
            </div>

            <div className="relative w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto select-none overflow-visible"
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <defs>
                        <linearGradient id="oceanAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? "0.24" : "0.14"} />
                            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {yTicks.map((tickVal, idx) => {
                        const yPos = getY(tickVal);
                        return (
                            <g key={idx}>
                                <line
                                    x1={padLeft}
                                    y1={yPos}
                                    x2={width - padRight}
                                    y2={yPos}
                                    stroke={gridColor}
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                />
                                <text
                                    x={padLeft - 8}
                                    y={yPos + 4}
                                    textAnchor="end"
                                    fill="var(--text-secondary)"
                                    className="text-[11px] font-mono"
                                >
                                    {formatVal(tickVal)}
                                </text>
                            </g>
                        );
                    })}

                    {validPoints.length > 1 && <path d={areaPath} fill="url(#oceanAreaGradient)" />}

                    {validPoints.length > 1 && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    <circle
                        cx={getX(validPoints.length - 1)}
                        cy={getY(validPoints[validPoints.length - 1].value)}
                        r="4.5"
                        fill={strokeColor}
                        stroke={pointBorder}
                        strokeWidth="2"
                    />

                    {validPoints.map((pt, idx) => {
                        const cx = getX(idx);
                        const cy = getY(pt.value);
                        const sliceW = plotW / Math.max(validPoints.length, 1);

                        return (
                            <g key={idx}>
                                {hoverIndex === idx && (
                                    <>
                                        <line
                                            x1={cx}
                                            y1={padTop}
                                            x2={cx}
                                            y2={padTop + plotH}
                                            stroke={strokeColor}
                                            strokeWidth="1"
                                            strokeDasharray="2 2"
                                        />
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r="5"
                                            fill="#F97316"
                                            stroke={pointBorder}
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                                <rect
                                    x={cx - sliceW / 2}
                                    y={padTop}
                                    width={sliceW}
                                    height={plotH}
                                    fill="transparent"
                                    className="cursor-crosshair"
                                    onMouseEnter={() => setHoverIndex(idx)}
                                />
                            </g>
                        );
                    })}

                    <text
                        x={padLeft}
                        y={height - 8}
                        textAnchor="start"
                        fill="var(--text-secondary)"
                        className="text-[11px] font-mono"
                    >
                        {validPoints[0].timestamp.split(" ")[1] || validPoints[0].timestamp}
                    </text>
                    <text
                        x={width - padRight}
                        y={height - 8}
                        textAnchor="end"
                        fill="var(--text-secondary)"
                        className="text-[11px] font-mono"
                    >
                        {validPoints[validPoints.length - 1].timestamp.split(" ")[1] ||
                            validPoints[validPoints.length - 1].timestamp}
                    </text>
                </svg>
            </div>
        </div>
    );
}