"use client"

import React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

const Memory = () => {
    const [stats, setStats] = useState({
        memory: {
            vmPeak: "0 KB",
            vmSize: "0 KB",
            vmRSS: "0 KB",
            prediction: 0,
        }
    });
    
    const dummyStats = {
        memory: {
            vmPeak: "78370704 KB",
            vmSize: "77108452 KB",
            vmRSS: "617896 KB",
            prediction: 1,
        }
    }
    
    useEffect(() => {
        // Simulate API fetch with timeout
        setTimeout(() => {
            setStats(dummyStats);
        }, 500);
    }, []);
    
    // Format memory values for better readability
    const formatMemory = (memoryString) => {
        if (!memoryString) return "0 KB";
        
        const value = Number.parseInt(memoryString.split(" ")[0])
        if (value > 1000000) {
            return `${(value / 1000000).toFixed(2)} GB`
        } else if (value > 1000) {
            return `${(value / 1000).toFixed(2)} MB`
        }
        return memoryString
    }
    
    // Prepare data for memory chart with safe access
    const memoryData = [
        {
            name: "Peak",
            value: stats?.memory?.vmPeak ? Number.parseInt(stats.memory.vmPeak.split(" ")[0]) / 1000 : 0, // Convert to MB
        },
        {
            name: "Size",
            value: stats?.memory?.vmSize ? Number.parseInt(stats.memory.vmSize.split(" ")[0]) / 1000 : 0,
        },
        {
            name: "RSS",
            value: stats?.memory?.vmRSS ? Number.parseInt(stats.memory.vmRSS.split(" ")[0]) / 1000 : 0,
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
                    <p className="text-sm font-medium">{`${label}: ${payload[0].value} MB`}</p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Memory Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">VM Peak</span>
                            <span className="font-medium">{formatMemory(stats?.memory?.vmPeak)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">VM Size</span>
                            <span className="font-medium">{formatMemory(stats?.memory?.vmSize)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">VM RSS</span>
                            <span className="font-medium">{formatMemory(stats?.memory?.vmRSS)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Trend</span>
                            <span>{renderPrediction(stats?.memory?.prediction || 0)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-3">Memory Usage (MB)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={memoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Memory