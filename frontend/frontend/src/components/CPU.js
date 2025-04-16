"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ArrowDown, ArrowUp, Minus,AlertTriangle,Wifi } from "lucide-react"
import { useWebSocket } from "../app/websockets"

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
  // State for historical data
  const [historyData, setHistoryData] = useState([])

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

      if (totalCPUTime === 0) totalCPUTime = userTime + systemTime + childUserTime + childSystemTime

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

      // Add current data point to history with timestamp
      const timestamp = new Date()
      const formattedTime = timestamp.toLocaleTimeString()
      
      setHistoryData(prevData => {
        // Keep only the last 20 data points to prevent overcrowding
        const newData = [...prevData, {
          time: formattedTime,
          totalCPU: totalCPUTime,
          userTime: userTime,
          systemTime: systemTime
        }]
        
        if (newData.length > 20) {
          return newData.slice(newData.length - 20)
        }
        return newData
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
          <p className="text-sm font-mono">{`${label}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  const LineChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black p-2 border border-green-500 rounded shadow-sm text-green-400">
          <p className="text-sm font-mono">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-mono" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Function to request test data from WebSocket
  const handleTestData = () => {
    sendTestData("CPU")
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
                        metrics?.cpu?.status === 'Anomaly' 
                        ? 'border-red-500 bg-red-900/20 text-red-400' 
                        : 'border-green-500 bg-green-900/20 text-green-400'
                    }`}>
                        {metrics?.cpu?.status === 'Anomaly' && <AlertTriangle className="h-5 w-5" />}
                        <span className="font-bold">Status: {metrics?.cpu?.status || 'Normal'}</span>
                    </div>
                </div>
          <h2 className="text-xl font-semibold text-green-400">CPU Usage</h2>
          {/* <button
            onClick={handleTestData}
            className="px-4 py-2 bg-green-900 text-green-400 rounded hover:bg-green-800 transition-colors border border-green-500 font-mono"
          >
            Generate Test Data
          </button> */}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Line chart showing historical data */}
          <div className="lg:w-2/3 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
              CPU Usage History (Updates every 5s)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00ff0030" />
                  <XAxis dataKey="time" stroke="#00ff00" />
                  <YAxis stroke="#00ff00" />
                  <Tooltip content={<LineChartTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalCPU" 
                    stroke="#00ff00" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }}
                    name="Total CPU"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="userTime" 
                    stroke="#00aaff" 
                    strokeWidth={1.5} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                    name="User Time"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="systemTime" 
                    stroke="#ff00ff" 
                    strokeWidth={1.5} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                    name="System Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Distribution chart below the line chart */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                CPU Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cpuData}>
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

          {/* Right side - CPU Metrics panel (highlighted) */}
          <div className="lg:w-1/3">
            <div className="bg-black/70 p-4 rounded border-2 border-green-500 backdrop-blur-sm shadow-lg shadow-green-500/20 pulse-glow">
              <h3 className="text-lg font-medium mb-3 text-green-500 border-b border-green-500/50 pb-2">
                Current CPU Metrics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">User Time</span>
                  <span className="font-medium">{stats?.cpu?.userTime || 0}ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">System Time</span>
                  <span className="font-medium">{stats?.cpu?.systemTime || 0}ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">Child User Time</span>
                  <span className="font-medium">{stats?.cpu?.childUserTime || 0}ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">Child System Time</span>
                  <span className="font-medium">{stats?.cpu?.childSystemTime || 0}ms</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-500/20 bg-green-900/20 px-3 rounded">
                  <span className="text-green-400 font-bold">Total CPU Time</span>
                  <span className="font-bold text-green-300">{stats?.cpu?.totalCPUTime || 0}ms</span>
                </div>
                <div className="flex justify-between py-2 mt-2">
                  <span className="text-green-500">Trend</span>
                  <span>{renderPrediction(stats?.cpu?.prediction || 0)}</span>
                </div>
              </div>
            </div>

            {/* Status information */}
            {metrics?.cpu?.values?.length > 0 && (
              <div className="mt-6 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
                <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                  Status
                </h3>
                <div className="p-4 border border-green-500/30 rounded-md bg-black/70">
                  <p className="text-sm text-green-400">
                    {metrics.cpu.values.length} data points available • Latest Status:{" "}
                    <span className={metrics.cpu.status === "Normal" ? "text-green-400" : "text-red-400"}>
                      {metrics.cpu.status}
                    </span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Add some system statistics or alerts as needed */}
            <div className="mt-6 bg-black/50 p-4 rounded border border-green-500/50 backdrop-blur-sm">
              <h3 className="text-lg font-medium mb-3 text-green-400 border-b border-green-500/30 pb-2">
                System Info
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">Last Update</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-500/20">
                  <span className="text-green-500">Update Interval</span>
                  <span className="font-medium">5s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .pulse-glow {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(0, 255, 0, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default CPU