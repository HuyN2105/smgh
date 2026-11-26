//
// Created by HuyN on 2026/11/26.
// Description: Định nghĩa các kiểu dữ liệu TypeScript cho bản ghi cảm biến (SensorReading)
// và phản hồi đăng ký thiết bị từ Central Server.
//

export interface SensorReading {
    id?: string;
    device_id: string;
    timestamp: string; // Định dạng "yyyy/mm/dd hh:mm:ss" từ Go server
    metrics: Record<string, number>; // Map động: temperature, humidity, soil_moisture, light...
}

export interface RegisterDeviceResponse {
    device_id: string;
    token: string;
    message?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";