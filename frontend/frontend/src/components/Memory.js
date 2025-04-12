"use client"

import React, { useState, useEffect } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { useWebSocket } from "../app/websockets"

const Memory = () => {
    const { metrics, sendTestData } = useWebSocket();
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
        if (metrics && metrics.memory && metrics.memory.latestValue) {
            const latest = metrics.memory.latestValue;
            setStats({
                memory: {
                    rss: latest * 0.4,
                    heapTotal: latest * 0.3,
                    heapUsed: latest * 0.2,
                    external: latest * 0.1,
                    totalMemory: latest,
                    prediction: metrics.memory.status === 'Anomaly' ? -1 : 1,
                }
            });
        } else {
            setTimeout(() => {
                const dummyStats = {
                    memory: {
                        rss: 0,
                        heapTotal: 0,
                        heapUsed: 0,
                        external: 0,
                        totalMemory: 0,
                        prediction: 0,
                    }
                };
                setStats(dummyStats);
            }, 500);
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
                <div className="flex items-center text-green-600">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>Increasing</span>
                </div>
            )
        } else if (value === -1) {
            return (
                <div className="flex items-center text-red-600">
                    <ArrowDown className="h-4 w-4 mr-1" />
                    <span>Decreasing</span>
                </div>
            )
        }
        return (
            <div className="flex items-center text-gray-600">
                <Minus className="h-4 w-4 mr-1" />
                <span>Stable</span>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border rounded shadow-sm">
                    <p className="text-sm font-medium">{`${label}: ${payload[0].value} MB`}</p>
                </div>
            )
        }
        return null
    }

    const handleTestData = () => {
        sendTestData('Memory');
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Memory Usage</h2>
                <button 
                    onClick={handleTestData}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Generate Test Data
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Memory Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">RSS</span>
                            <span className="font-medium">{stats?.memory?.rss || 0} MB</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Heap Total</span>
                            <span className="font-medium">{stats?.memory?.heapTotal || 0} MB</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Heap Used</span>
                            <span className="font-medium">{stats?.memory?.heapUsed || 0} MB</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">External</span>
                            <span className="font-medium">{stats?.memory?.external || 0} MB</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total Memory</span>
                            <span className="font-medium">{stats?.memory?.totalMemory || 0} MB</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Trend</span>
                            <span>{renderPrediction(stats?.memory?.prediction || 0)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-3">Memory Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={memoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {metrics?.memory?.values?.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">Memory Usage History</h3>
                    <div className="p-4 border rounded-md bg-gray-50">
                        <p className="text-sm text-gray-600">
                            {metrics.memory.values.length} data points available
                            • Latest Status: <span className={metrics.memory.status === 'Normal' ? 'text-green-600' : 'text-red-600'}>
                                {metrics.memory.status}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Memory
