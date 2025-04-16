"use client"

import React, { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { useWebSocket } from "../app/websockets"

// Accept metrics as a prop here
const CPU = ({ metrics }) => {
  const { sendTestData } = useWebSocket()
  const [stats, setStats] = useState({
    cpu: {
      userTime: 0,
      systemTime: 0,
      childUserTime: 0,
      childSystemTime: 0,
      totalCPUTime: 0,
      prediction: 0,
    },
  })

  useEffect(() => {
    if (metrics?.cpu?.values?.length > 0) {
      const cpuValues = metrics.cpu.values
      let userTime = 0,
        systemTime = 0,
        childUserTime = 0,
        childSystemTime = 0,
        totalCPUTime = 0

      for (let i = cpuValues.length - 1; i >= 0; i--) {
        const item = cpuValues[i]
        if (item.subType === "utime" && userTime === 0) userTime = item.value
        else if (item.subType === "stime" && systemTime === 0) systemTime = item.value
        else if (item.subType === "cutime" && childUserTime === 0) childUserTime = item.value
        else if (item.subType === "cstime" && childSystemTime === 0) childSystemTime = item.value
        else if (item.subType === "total" && totalCPUTime === 0) totalCPUTime = item.value
      }

      if (totalCPUTime === 0)
        totalCPUTime = userTime + systemTime + childUserTime + childSystemTime

      setStats({
        cpu: {
          userTime,
          systemTime,
          childUserTime,
          childSystemTime,
          totalCPUTime,
          prediction: metrics.cpu.status === "Anomaly" ? -1 : 1,
        },
      })

      console.log("CPU component received metrics:", metrics)
    }
  }, [metrics])

    
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
    
    // Function to request test data from WebSocket
    const handleTestData = () => {
        sendTestData('CPU');
    }

    return(
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">CPU Usage</h2>
                <button 
                    onClick={handleTestData}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Generate Test Data
                </button>
            </div>
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
            
            {/* Optional: CPU History/Timeline Graph */}
            {metrics?.cpu?.values?.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-3">CPU Usage History</h3>
                    <div className="p-4 border rounded-md bg-gray-50">
                        <p className="text-sm text-gray-600">
                            {metrics.cpu.values.length} data points available
                            • Latest Status: <span className={metrics.cpu.status === 'Normal' ? 'text-green-600' : 'text-red-600'}>
                                {metrics.cpu.status}
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CPU