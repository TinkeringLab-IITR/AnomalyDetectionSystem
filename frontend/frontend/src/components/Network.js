"use client"

import React from "react"
import {useState, useEffect} from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

const Network = () => {
    const [stats, setStats] = useState({
        network: {
            sent: "0 bytes",
            received: "0 bytes",
            errors: 0,
            prediction: 0
        }
    });
    
    const dummyStats = {
        network: {
            sent: "543210 bytes",
            received: "1234567 bytes",
            errors: 3,
            prediction: 0,
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
                    <p className="text-sm font-medium">{`${label}: ${payload[0].value}`}</p>
                </div>
            )
        }
        return null
    }
    
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Network Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Sent</span>
                            <span className="font-medium">{stats?.network?.sent || "0 bytes"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Received</span>
                            <span className="font-medium">{stats?.network?.received || "0 bytes"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Errors</span>
                            <span className="font-medium">{stats?.network?.errors || 0}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Trend</span>
                            <span>{renderPrediction(stats?.network?.prediction || 0)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-3">Network Stats (KB)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={networkData}>
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
        </div>
    )
}

export default Network