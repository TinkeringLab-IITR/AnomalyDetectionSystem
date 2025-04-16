"use client"

import React from "react"
import {useState, useEffect} from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus, Wifi } from "lucide-react"

const Network = () => {
    const [stats, setStats] = useState({
        network: {
            sent: "0 bytes",
            received: "0 bytes",
            errors: 0,
            prediction: 0,
            status: "Normal" // Added status property similar to memory component
        }
    });
    
    const dummyStats = {
        network: {
            sent: "543210 bytes",
            received: "1234567 bytes",
            errors: 3,
            prediction: 0,
            status: "Normal"
        }
    }
    
    useEffect(() => {
        // Simulate API fetch with timeout
        setTimeout(() => {
            setStats(dummyStats);
        }, 500);
    }, []);
    
    // Make sure network data is safely accessed
    const networkData = [
        {
            name: "Sent",
            value: stats?.network?.sent ? Number.parseInt(stats.network.sent.split(" ")[0]) / 1000 : 0, // KB
        },
        {
            name: "Received",
            value: stats?.network?.received ? Number.parseInt(stats.network.received.split(" ")[0]) / 1000 : 0,
        },
        {
            name: "Errors",
            value: stats?.network?.errors || 0,
        },
    ]
    
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
                    <p className="text-sm font-mono">{`${label}: ${payload[0].value} KB`}</p>
                </div>
            )
        }
        return null
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
                {/* Status indicator - prominently displayed on right */}
                <div className="absolute top-0 right-0 p-0">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                        stats?.network?.status === 'Anomaly' 
                        ? 'border-red-500 bg-red-900/20 text-red-400' 
                        : 'border-green-500 bg-green-900/20 text-green-400'
                    }`}>
                        <Wifi className="h-5 w-5" />
                        <span className="font-bold">Status: {stats?.network?.status || 'Normal'}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-green-400">Network Traffic</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">Network Metrics</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Sent</span>
                                <span className="font-medium">{stats?.network?.sent || "0 bytes"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Received</span>
                                <span className="font-medium">{stats?.network?.received || "0 bytes"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-green-500/20">
                                <span className="text-green-500">Errors</span>
                                <span className="font-medium">{stats?.network?.errors || 0}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-green-500">Trend</span>
                                <span>{renderPrediction(stats?.network?.prediction || 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                        <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">Network Stats (KB)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={networkData}>
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

                {/* Additional Network Health Section */}
                <div className="mt-8 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                    <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                        Network Health Status
                    </h3>
                    <div className="p-4 border border-green-500/30 rounded-md bg-black/70">
                        <p className="text-sm text-green-400">
                            Current Latency: <span className="font-medium">45ms</span> • 
                            Packet Loss: <span className="font-medium">0.2%</span> • 
                            Status: <span className={stats?.network?.status === "Normal" ? "text-green-400" : "text-red-400"}>
                                {stats?.network?.status}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Network