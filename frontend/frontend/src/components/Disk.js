"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

const Disk = () => {
    const [stats, setStats] = useState({
        disk: {
            usage: "0 bytes",
            prediction: 0,
        }
    });
    
    const dummyStats = {
        disk: {
            usage: "32553 bytes",
            prediction: 1,
        }
    }
    
    useEffect(() => {
        // Simulate API fetch with timeout
        setTimeout(() => {
            setStats(dummyStats);
        }, 500);
    }, []);
    
    // Format disk usage for display
    const formatDiskUsage = (usage) => {
        if (!usage) return "0 bytes";
        
        const value = Number.parseInt(usage.split(" ")[0]);
        if (value > 1000000) {
            return `${(value / 1000000).toFixed(2)} MB`;
        } else if (value > 1000) {
            return `${(value / 1000).toFixed(2)} KB`;
        }
        return usage;
    }
    
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

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Disk Metrics</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Disk Usage</span>
                            <span className="font-medium">{stats?.disk?.usage || "0 bytes"}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-600">Trend</span>
                            <span>{renderPrediction(stats?.disk?.prediction || 0)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <div className="text-center p-6 bg-slate-50 rounded-lg w-full">
                        <div className="text-4xl font-bold text-slate-700 mb-2">
                            {formatDiskUsage(stats?.disk?.usage)}
                        </div>
                        <div className="text-sm text-slate-500">Current Disk Usage</div>
                        <div className="mt-4 flex justify-center">
                            {renderPrediction(stats?.disk?.prediction || 0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Disk