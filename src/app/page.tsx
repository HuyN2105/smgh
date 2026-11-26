//
// Created by HuyN on 2026/11/26.
// Description: Trang giao diện chính của Admin Dashboard giám sát nhà kính thông minh,
// hỗ trợ chuyển đổi mượt giữa giao diện Sáng và giao diện Xanh biển tối (Deep Ocean).
//

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Thermometer,
    Droplets,
    Sprout,
    Sun,
    Wind,
    Plus,
    RefreshCw,
    Radio,
    AlertTriangle,
    Moon,
} from "lucide-react";
import { useGreenhouseStream } from "@/hooks/useGreenhouseStream";
import { TelemetryChart } from "@/components/TelemetryChart";
import { DeviceRegisterModal } from "@/components/DeviceRegisterModal";

interface MetricConfig {
    key: string;
    label: string;
    shortLabel: string;
    unit: string;
    decimals: number;
    minSafe?: number;
    maxSafe?: number;
    icon: React.ReactNode;
}

const METRIC_DEFINITIONS: MetricConfig[] = [
    {
        key: "temperature",
        label: "Nhiệt độ không khí",
        shortLabel: "Nhiệt độ",
        unit: "°C",
        decimals: 1,
        minSafe: 18,
        maxSafe: 34,
        icon: <Thermometer className="w-4 h-4" />,
    },
    {
        key: "humidity",
        label: "Độ ẩm không khí",
        shortLabel: "Độ ẩm KK",
        unit: "%",
        decimals: 1,
        minSafe: 50,
        maxSafe: 85,
        icon: <Droplets className="w-4 h-4" />,
    },
    {
        key: "soil_moisture",
        label: "Độ ẩm giá thể",
        shortLabel: "Độ ẩm đất",
        unit: "%",
        decimals: 1,
        minSafe: 40,
        maxSafe: 80,
        icon: <Sprout className="w-4 h-4" />,
    },
    {
        key: "lux",
        label: "Cường độ ánh sáng",
        shortLabel: "Ánh sáng",
        unit: "lux",
        decimals: 0,
        minSafe: 2000,
        maxSafe: 45000,
        icon: <Sun className="w-4 h-4" />,
    },
    {
        key: "co2_ppm",
        label: "Nồng độ CO₂",
        shortLabel: "CO₂",
        unit: "ppm",
        decimals: 0,
        minSafe: 350,
        maxSafe: 1200,
        icon: <Wind className="w-4 h-4" />,
    },
];

export default function GreenhouseAdminDashboard() {
    const [devices, setDevices] = useState<string[]>(["plant_node_01", "plant_node_02"]);
    const [selectedDevice, setSelectedDevice] = useState<string>("plant_node_01");
    const [activeMetricKey, setActiveMetricKey] = useState<string>("temperature");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("smgh_theme");
        const shouldBeDark = savedTheme === "dark";
        setIsDark(shouldBeDark);
        document.documentElement.classList.toggle("dark", shouldBeDark);
    }, []);

    const toggleTheme = () => {
        setIsDark((prev) => {
            const next = !prev;
            document.documentElement.classList.toggle("dark", next);
            localStorage.setItem("smgh_theme", next ? "dark" : "light");
            return next;
        });
    };

    const {
        readings,
        latestReading,
        status,
        isLoadingHistory,
        errorMessage,
        refreshHistory,
    } = useGreenhouseStream(selectedDevice);

    const activeMetric = useMemo(
        () => METRIC_DEFINITIONS.find((m) => m.key === activeMetricKey) || METRIC_DEFINITIONS[0],
        [activeMetricKey]
    );

    const handleDeviceRegistered = (newId: string) => {
        setDevices((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
        setSelectedDevice(newId);
    };

    return (
        <div className="min-h-screen app-bg font-sans">
            {/* Thanh điều hướng trạm kiểm soát */}
            <header className="surface-bg theme-border border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center font-mono text-sm font-bold">
                            GH
                        </div>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight">
                                Trạm Quan Trắc Nhà Kính
                            </h1>
                            <p className="text-xs text-muted hidden sm:block">
                                Hệ thống thu thập & điều phối dữ liệu cảm biến trung tâm
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Chỉ báo trạng thái WebSocket */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md app-bg theme-border border text-xs font-medium">
              <span
                  className={`w-2 h-2 rounded-full ${
                      status === "connected"
                          ? "bg-accent animate-pulse"
                          : status === "connecting"
                              ? "bg-amber-400"
                              : "bg-[#f97316]"
                  }`}
              />
                            <span>
                {status === "connected"
                    ? "Trực tuyến (WSS)"
                    : status === "connecting"
                        ? "Đang kết nối..."
                        : "Mất kết nối"}
              </span>
                        </div>

                        {/* Nút chuyển đổi Sáng / Xanh biển tối */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện xanh biển tối"}
                            aria-label="Đổi giao diện"
                            className="p-2 rounded-md app-bg theme-border border text-main hover:opacity-80"
                        >
                            {isDark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-accent rounded-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Đăng ký thiết bị</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Thanh chọn nút cảm biến & làm mới */}
                <div className="flex flex-wrap items-center justify-between gap-4 surface-bg p-4 theme-border border rounded-lg">
                    <div className="flex flex-wrap items-center gap-3">
                        <label
                            htmlFor="device-select"
                            className="text-sm font-medium text-muted flex items-center gap-1.5"
                        >
                            <Radio className="w-4 h-4 text-accent" />
                            <span>Nút cảm biến:</span>
                        </label>
                        <select
                            id="device-select"
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="px-3 py-1.5 text-sm font-mono app-bg theme-border border rounded-md text-main focus:outline-none"
                        >
                            {devices.map((id) => (
                                <option key={id} value={id}>
                                    {id}
                                </option>
                            ))}
                            <option value="all">Tất cả thiết bị (Luồng tổng)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted">
                        {latestReading && (
                            <span className="font-mono tabular-nums">
                Gói tin cuối: {latestReading.timestamp}
              </span>
                        )}
                        <button
                            onClick={refreshHistory}
                            disabled={isLoadingHistory}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 theme-border border rounded-md hover-row text-main font-medium disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                            <span>Đồng bộ lịch sử</span>
                        </button>
                    </div>
                </div>

                {/* Thông báo lỗi kết nối nếu có */}
                {errorMessage && (
                    <div className="flex items-center justify-between p-4 subtle-bg theme-border border rounded-lg text-sm text-alert">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                        <button onClick={refreshHistory} className="underline font-medium text-xs">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Khu vực chính: Lưới 5 chỉ số bên trái + Biểu đồ lịch sử bên phải */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Cột trái: 5 thông số môi trường */}
                    <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                        {METRIC_DEFINITIONS.map((item, index) => {
                            const rawVal = latestReading?.metrics?.[item.key];
                            const hasValue = typeof rawVal === "number";
                            const isOutOfRange =
                                hasValue &&
                                ((item.minSafe !== undefined && rawVal < item.minSafe) ||
                                    (item.maxSafe !== undefined && rawVal > item.maxSafe));
                            const isSelected = activeMetricKey === item.key;
                            const isLastOddItem =
                                index === METRIC_DEFINITIONS.length - 1 && METRIC_DEFINITIONS.length % 2 === 1;

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setActiveMetricKey(item.key)}
                                    className={`text-left p-5 rounded-lg surface-bg theme-border border ${
                                        isLastOddItem ? "sm:col-span-2" : ""
                                    } ${isSelected ? "card-active" : ""}`}
                                >
                                    <div className="flex items-center justify-between text-muted mb-3">
                                        <span className="text-xs font-medium">{item.label}</span>
                                        <span className={isOutOfRange ? "text-alert" : "text-accent"}>
                      {item.icon}
                    </span>
                                    </div>

                                    <div className="flex items-baseline gap-1.5">
                    <span
                        className={`text-3xl font-semibold font-mono tabular-nums tracking-tight ${
                            isOutOfRange ? "text-alert" : "text-main"
                        }`}
                    >
                      {hasValue ? rawVal.toFixed(item.decimals) : "--"}
                    </span>
                                        <span className="text-xs font-medium text-muted">{item.unit}</span>
                                    </div>

                                    <div className="mt-3 pt-2.5 theme-border border-t flex items-center justify-between text-[11px]">
                    <span className="text-muted">
                      Ngưỡng: {item.minSafe}–{item.maxSafe} {item.unit}
                    </span>
                                        {isOutOfRange && <span className="font-medium text-alert">Vượt ngưỡng</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cột phải: Biểu đồ diễn biến thông số */}
                    <div className="lg:col-span-7 surface-bg theme-border border rounded-lg p-5 flex flex-col justify-between">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 theme-border border-b">
                            <div>
                                <h2 className="text-sm font-semibold">
                                    Biểu đồ biến thiên: {activeMetric.label}
                                </h2>
                                <p className="text-xs text-muted">
                                    Hiển thị {readings.length} điểm dữ liệu gần nhất (tự động cập nhật)
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {METRIC_DEFINITIONS.map((m) => (
                                    <button
                                        key={m.key}
                                        onClick={() => setActiveMetricKey(m.key)}
                                        className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                                            activeMetricKey === m.key
                                                ? "bg-accent"
                                                : "app-bg text-muted hover:text-main"
                                        }`}
                                    >
                                        {m.shortLabel}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <TelemetryChart
                            readings={readings}
                            metricKey={activeMetric.key}
                            unit={activeMetric.unit}
                            label={activeMetric.label}
                            isDark={isDark}
                        />
                    </div>
                </div>

                {/* Bảng nhật ký gói tin thời gian thực */}
                <section className="surface-bg theme-border border rounded-lg overflow-hidden">
                    <div className="px-5 py-4 theme-border border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">
                                Nhật ký gói tin cảm biến gần đây
                            </h2>
                            <p className="text-xs text-muted">
                                Dữ liệu thô được đồng bộ từ MongoDB Atlas và luồng WebSocket trực tiếp
                            </p>
                        </div>
                        <span className="text-xs font-mono text-muted">
              Tổng: {readings.length} bản ghi
            </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="app-bg theme-border border-b text-xs font-medium text-muted">
                                <th className="py-2.5 px-5">Dấu thời gian</th>
                                <th className="py-2.5 px-5">Mã thiết bị</th>
                                <th className="py-2.5 px-5">Nhiệt độ</th>
                                <th className="py-2.5 px-5">Độ ẩm KK</th>
                                <th className="py-2.5 px-5">Độ ẩm đất</th>
                                <th className="py-2.5 px-5">Ánh sáng</th>
                                <th className="py-2.5 px-5">CO₂</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-main)] text-xs font-mono tabular-nums">
                            {readings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center font-sans text-muted">
                                        {isLoadingHistory
                                            ? "Đang tải dữ liệu từ Central Server..."
                                            : "Chưa có bản ghi nào cho thiết bị này."}
                                    </td>
                                </tr>
                            ) : (
                                [...readings]
                                    .reverse()
                                    .slice(0, 10)
                                    .map((row, idx) => (
                                        <tr key={`${row.timestamp}-${idx}`} className="hover-row">
                                            <td className="py-2.5 px-5 text-muted">{row.timestamp}</td>
                                            <td className="py-2.5 px-5 font-medium text-accent">{row.device_id}</td>
                                            <td className="py-2.5 px-5">
                                                {typeof row.metrics?.temperature === "number"
                                                    ? `${row.metrics.temperature.toFixed(1)} °C`
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5 px-5">
                                                {typeof row.metrics?.humidity === "number"
                                                    ? `${row.metrics.humidity.toFixed(1)} %`
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5 px-5">
                                                {typeof row.metrics?.soil_moisture === "number"
                                                    ? `${row.metrics.soil_moisture.toFixed(1)} %`
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5 px-5">
                                                {typeof row.metrics?.lux === "number"
                                                    ? `${row.metrics.lux.toFixed(0)} lux`
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5 px-5">
                                                {typeof row.metrics?.co2_ppm === "number"
                                                    ? `${row.metrics.co2_ppm.toFixed(0)} ppm`
                                                    : "—"}
                                            </td>
                                        </tr>
                                    ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            <DeviceRegisterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRegistered={handleDeviceRegistered}
            />
        </div>
    );
}