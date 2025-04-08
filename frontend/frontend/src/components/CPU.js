"use client"

import React from "react"
import {useState, useEffect} from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

const CPU = () => {
    const [stats, setStats] = useState({
        cpu: {
            userTime: 0,
            systemTime: 0,
            childUserTime: 0,
            childSystemTime: 0,
            totalCPUTime: 0,
            prediction: 0,
        }
    });
    
    const dummyStats = {
        cpu: {
            userTime: 10657,
            systemTime: 6219,
            childUserTime: 3016,
            childSystemTime: 1175,
            totalCPUTime: 21067,
            prediction: -1,
        }
    }
    
    useEffect(() => {
        // Simulate API fetch with timeout
        setTimeout(() => {
            setStats(dummyStats);
        }, 500);
    }, []);
    
    // Make sure CPU data is safely accessed
    const cpuData = [
        { name: "User", value: stats?.cpu?.userTime || 0 },
        { name: "System", value: stats?.cpu?.systemTime || 0 },
        { name: "Child User", value: stats?.cpu?.childUserTime || 0 },
        { name: "Child System", value: stats?.cpu?.childSystemTime || 0 },
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

    return(
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">CPU Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">User Time</span>
                            <span className="font-medium">{stats?.cpu?.userTime || 0}ms</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">System Time</span>
                            <span className="font-medium">{stats?.cpu?.systemTime || 0}ms</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Child User Time</span>
                            <span className="font-medium">{stats?.cpu?.childUserTime || 0}ms</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Child System Time</span>
                            <span className="font-medium">{stats?.cpu?.childSystemTime || 0}ms</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Total CPU Time</span>
                            <span className="font-medium">{stats?.cpu?.totalCPUTime || 0}ms</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Trend</span>
                            <span>{renderPrediction(stats?.cpu?.prediction || 0)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-3">CPU Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cpuData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CPU