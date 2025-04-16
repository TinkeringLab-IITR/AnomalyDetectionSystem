"use client"

import React, { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Minus, HardDrive,AlertTriangle } from "lucide-react"
import { useWebSocket } from "../app/websockets"

const Disk = ({ metrics }) => {
    const { sendTestData } = useWebSocket();
    
    const [stats, setStats] = useState({
        disk: {
            usage: "0 bytes",
            prediction: 0,
        }
    });

    useEffect(() => {
        if (metrics && metrics.disk && metrics.disk.values && metrics.disk.values.length > 0) {
            // Get the latest disk value
            const latestDiskData = metrics.disk.values[metrics.disk.values.length - 1];
            
            setStats({
                disk: {
                    usage: `${latestDiskData.value} bytes`,
                    prediction: latestDiskData.status === 'Anomaly' ? -1 : 1,
                }
            });
        }
    }, [metrics]);

    const formatDiskUsage = (usage) => {
        if (!usage) return "0 bytes";
        const value = Number.parseInt(usage.split(" ")[0]);
        if (value > 1_000_000) return `${(value / 1_000_000).toFixed(2)} MB`;
        if (value > 1_000) return `${(value / 1_000).toFixed(2)} KB`;
        return usage;
    }

    const renderPrediction = (value) => {
        if (value === 1) {
            return (
                <div className="flex items-center text-green-400">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>Increasing</span>
                </div>
            )
        } else if (value === -1) {
            return (
                <div className="flex items-center text-red-400">
                    <ArrowDown className="h-4 w-4 mr-1" />
                    <span>Decreasing</span>
                </div>
            )
        }
        return (
            <div className="flex items-center text-gray-400">
                <Minus className="h-4 w-4 mr-1" />
                <span>Stable</span>
            </div>
        )
    }

    const handleTestData = () => {
        sendTestData('Disk');
    }

    return (
        <div className="space-y-4 bg-black text-green-400 font-mono p-6 rounded-lg border border-green-500 relative overflow-hidden">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #00ff00 1px, transparent 1px), linear-gradient(to bottom, #00ff00 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            <div className="relative">
                <div className="flex justify-between items-center mb-4">
                    <div className="absolute top-0 right-0 p-(-1)">
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                                            metrics?.disk?.status === 'Anomaly' 
                                            ? 'border-red-500 bg-red-900/20 text-red-400' 
                                            : 'border-green-500 bg-green-900/20 text-green-400'
                                        }`}>
                                            {metrics?.disk?.status === 'Anomaly' && <AlertTriangle className="h-5 w-5" />}
                                            <span className="font-bold">Status: {metrics?.disk?.status || 'Normal'}</span>
                                        </div>
                                    </div>
                    <h2 className="text-xl font-semibold text-green-400">Disk Usage</h2>
                    {/* <button 
                        onClick={handleTestData}
                        className="px-4 py-2 bg-green-900 text-green-400 rounded hover:bg-green-800 transition-colors border border-green-500 font-mono"
                    >
                        Generate Test Data
                    </button> */}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">Disk Metrics</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Disk Usage</span>
                                <span className="font-medium">{stats?.disk?.usage || "0 bytes"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Formatted Usage</span>
                                <span className="font-medium">{formatDiskUsage(stats?.disk?.usage)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-green-500">Trend</span>
                                <span>{renderPrediction(stats?.disk?.prediction || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center p-6 bg-black/70 border border-green-500/30 rounded-lg w-full">
                            <HardDrive className="mx-auto h-8 w-8 text-green-400 mb-2" />
                            <div className="text-4xl font-bold text-green-400 mb-2 tracking-wider font-mono">
                                {formatDiskUsage(stats?.disk?.usage)}
                            </div>
                            <div className="text-sm text-green-500">CURRENT DISK USAGE</div>
                            <div className="mt-4 flex justify-center">
                                {renderPrediction(stats?.disk?.prediction || 0)}
                            </div>
                            <div className="mt-4 w-full bg-black/50 h-2 rounded-full border border-green-500/50">
                                <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ 
                                        width: '65%', 
                                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)' 
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disk history summary */}
                {metrics?.disk?.values?.length > 0 && (
                    <div className="mt-8 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                            Disk Usage History
                        </h3>
                        <div className="p-4 border border-green-500/30 rounded-md bg-black/70">
                            <p className="text-sm text-green-400">
                                {metrics.disk.values.length} data points available • Latest Status:{" "}
                                <span className={metrics.disk.status === "Normal" ? "text-green-400" : "text-red-400"}>
                                    {metrics.disk.status}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Disk;