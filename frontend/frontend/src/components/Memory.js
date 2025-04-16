"use client"

import React, { useState, useEffect } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { useWebSocket } from "../app/websockets"

const Memory = ({ metrics }) => {
    const { sendTestData } = useWebSocket();
    const [stats, setStats] = useState({
        memory: {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            totalMemory: 0,
            prediction: 0,
        }
    });

    useEffect(() => {
        if (metrics && metrics.memory && metrics.memory.values && metrics.memory.values.length > 0) {
            // Get the latest memory value
            const latestMemData = metrics.memory.values[metrics.memory.values.length - 1];
            const latest = latestMemData.value;
            
            // Since your server doesn't break down memory components,
            // we'll use your existing proportional calculations
            setStats({
                memory: {
                    rss: (latest * 0.4).toFixed(0),
                    heapTotal: (latest * 0.3).toFixed(0),
                    heapUsed: (latest * 0.2).toFixed(0),
                    external: (latest * 0.1).toFixed(0),
                    totalMemory: latest,
                    prediction: latestMemData.status === 'Anomaly' ? -1 : 1,
                }
            });
        }
    }, [metrics]);

    const memoryData = [
        { name: "RSS", value: stats?.memory?.rss || 0 },
        { name: "Heap Total", value: stats?.memory?.heapTotal || 0 },
        { name: "Heap Used", value: stats?.memory?.heapUsed || 0 },
        { name: "External", value: stats?.memory?.external || 0 },
    ];

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

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black p-2 border border-green-500 rounded shadow-sm text-green-400">
                    <p className="text-sm font-mono">{`${label}: ${payload[0].value} MB`}</p>
                </div>
            )
        }
        return null
    }

    const handleTestData = () => {
        sendTestData('Memory');
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
                    <h2 className="text-xl font-semibold text-green-400">Memory Usage</h2>
                    {/* <button 
                        onClick={handleTestData}
                        className="px-4 py-2 bg-green-900 text-green-400 rounded hover:bg-green-800 transition-colors border border-green-500 font-mono"
                    >
                        Generate Test Data
                    </button> */}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">Memory Metrics</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">RSS</span>
                                <span className="font-medium">{stats?.memory?.rss || 0} MB</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Heap Total</span>
                                <span className="font-medium">{stats?.memory?.heapTotal || 0} MB</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Heap Used</span>
                                <span className="font-medium">{stats?.memory?.heapUsed || 0} MB</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">External</span>
                                <span className="font-medium">{stats?.memory?.external || 0} MB</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Total Memory</span>
                                <span className="font-medium">{stats?.memory?.totalMemory || 0} MB</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-green-500">Trend</span>
                                <span>{renderPrediction(stats?.memory?.prediction || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">Memory Distribution</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={memoryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#00ff0030" vertical={false} />
                                    <XAxis dataKey="name" stroke="#00ff00" />
                                    <YAxis stroke="#00ff00" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#00ff00" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Memory History/Timeline */}
                {metrics?.memory?.values?.length > 0 && (
                    <div className="mt-8 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                            Memory Usage History
                        </h3>
                        <div className="p-4 border border-green-500/30 rounded-md bg-black/70">
                            <p className="text-sm text-green-400">
                                {metrics.memory.values.length} data points available • Latest Status:{" "}
                                <span className={metrics.memory.status === "Normal" ? "text-green-400" : "text-red-400"}>
                                    {metrics.memory.status}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Memory