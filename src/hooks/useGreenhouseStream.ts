//
// Created by HuyN on 2026/11/26.
// Description: Custom React Hook quản lý luồng dữ liệu kết hợp giữa REST API lịch sử
// và WebSocket thời gian thực từ Central Server, hỗ trợ tự động kết nối lại.
//

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SensorReading, ConnectionStatus } from "@/types/telemetry";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://handshake.huyn.site";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://handshake.huyn.site/ws/dashboard";
const MAX_HISTORY_POINTS = 60;

export function useGreenhouseStream(deviceId: string) {
    const [readings, setReadings] = useState<SensorReading[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Nạp dữ liệu lịch sử qua REST API
    const fetchRecentTelemetry = useCallback(async () => {
        setIsLoadingHistory(true);
        setErrorMessage(null);
        try {
            const url = `${API_BASE}/api/v1/telemetry/recent?device_id=${encodeURIComponent(
                deviceId
            )}&limit=${MAX_HISTORY_POINTS}`;

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Lỗi máy chủ (${res.status}) khi tải dữ liệu lịch sử`);
            }

            const data: SensorReading[] = await res.json();
            // Đảm bảo dữ liệu sắp xếp theo thứ tự thời gian tăng dần để vẽ biểu đồ từ trái sang phải
            const sorted = Array.isArray(data)
                ? [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                : [];
            setReadings(sorted);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Không thể kết nối tới API lịch sử");
        } finally {
            setIsLoadingHistory(false);
        }
    }, [deviceId]);

    // Kết nối WebSocket nhận dữ liệu nhảy trực tiếp
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            await fetchRecentTelemetry();
            if (isMounted) {
                connectWS();
            }
        };

        const connectWS = () => {
            if (!isMounted) return;
            setStatus("connecting");

            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;
                setStatus("connected");
                setErrorMessage(null);
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const incoming: SensorReading = JSON.parse(event.data);
                    // Chỉ cập nhật nếu gói tin thuộc đúng thiết bị đang chọn (hoặc chế độ xem tất cả)
                    if (deviceId === "all" || incoming.device_id === deviceId) {
                        setReadings((prev) => {
                            const updated = [...prev, incoming];
                            return updated.slice(-MAX_HISTORY_POINTS);
                        });
                    }
                } catch {
                    // Bỏ qua các frame không phải JSON hợp lệ
                }
            };

            ws.onerror = () => {
                if (!isMounted) return;
                setStatus("error");
            };

            ws.onclose = () => {
                if (!isMounted) return;
                setStatus("disconnected");
                // Tự động thử kết nối lại sau 3 giây
                reconnectTimerRef.current = setTimeout(connectWS, 3000);
            };
        };

        init();

        return () => {
            isMounted = false;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [deviceId, fetchRecentTelemetry]);

    const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

    return {
        readings,
        latestReading,
        status,
        isLoadingHistory,
        errorMessage,
        refreshHistory: fetchRecentTelemetry,
    };
}