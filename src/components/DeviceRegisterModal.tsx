//
// Created by HuyN on 2026/11/26.
// Description: Hộp thoại đăng ký thiết bị IoT mới thông qua REST API và cấp phát mã JWT Token
// để nạp vào firmware ESP32.
//

"use client";

import React, { useState } from "react";
import { X, Copy, Check, Cpu } from "lucide-react";
import { RegisterDeviceResponse } from "@/types/telemetry";

interface DeviceRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegistered: (newDeviceId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://handshake.huyn.site";

export function DeviceRegisterModal({
                                        isOpen,
                                        onClose,
                                        onRegistered,
                                    }: DeviceRegisterModalProps) {
    const [deviceId, setDeviceId] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<RegisterDeviceResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId.trim()) return;

        setIsSubmitting(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/api/v1/devices/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    device_id: deviceId.trim(),
                    name: deviceName.trim() || deviceId.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || `Đăng ký thất bại (${res.status})`);
            }

            setResult(data);
            onRegistered(deviceId.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyToken = () => {
        if (!result?.token) return;
        navigator.clipboard.writeText(result.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetAndClose = () => {
        setDeviceId("");
        setDeviceName("");
        setResult(null);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md surface-bg theme-border border rounded-lg p-6 shadow-xl text-main">
                <div className="flex items-center justify-between pb-4 theme-border border-b">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-accent" />
                        <h2 className="text-base font-semibold">Đăng ký nút cảm biến mới</h2>
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="text-muted hover:text-main p-1 rounded"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!result ? (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Mã định danh thiết bị (Device ID)
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: plant_node_02"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                className="w-full px-3 py-2 text-sm font-mono app-bg theme-border border rounded-md focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Vị trí lắp đặt / Mô tả
                            </label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Khu vực ươm cây khu B"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                className="w-full px-3 py-2 text-sm app-bg theme-border border rounded-md focus:outline-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-xs text-alert subtle-bg theme-border border rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={resetAndClose}
                                className="px-4 py-2 text-sm font-medium text-muted hover:text-main"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium bg-accent rounded-md disabled:opacity-50"
                            >
                                {isSubmitting ? "Đang cấp phát..." : "Tạo thiết bị & Lấy Token"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-4 space-y-4">
                        <div className="p-3 app-bg theme-border border rounded-md">
                            <p className="text-xs text-muted mb-1">
                                Đã khởi tạo thành công thiết bị{" "}
                                <strong className="font-mono text-accent">{result.device_id}</strong>. Sao chép JWT
                                Token bên dưới để cấu hình kết nối WebSocket cho ESP32:
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <code className="flex-1 p-2 text-xs font-mono surface-bg theme-border border rounded overflow-x-auto text-main">
                                    {result.token}
                                </code>
                                <button
                                    onClick={handleCopyToken}
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-accent rounded"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Đã chép" : "Sao chép"}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={resetAndClose}
                                className="px-4 py-2 text-sm font-medium bg-accent rounded-md"
                            >
                                Hoàn tất
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}