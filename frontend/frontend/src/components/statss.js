"use client"

import { useState } from "react"
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import  Network  from "./Network"
import CPU from "./CPU"
import Memory from "./Memory"
import Disk from "./Disk"

const ProcessStat = () => {
  const [activeTab, setActiveTab] = useState("cpu")

  const dummyStats = {
    pid: 459,
    port: 27121,
    
    memory: {
      vmPeak: "78370704 KB",
      vmSize: "77108452 KB",
      vmRSS: "617896 KB",
      prediction: 1,
    },
    disk: {
      usage: "32553 bytes",
      prediction: 1,
    },

  }
  
  

  // Format memory values for better readability
  const formatMemory = (memoryString) => {
    const value = Number.parseInt(memoryString.split(" ")[0])
    if (value > 1000000) {
      return `${(value / 1000000).toFixed(2)} GB`
    } else if (value > 1000) {
      return `${(value / 1000).toFixed(2)} MB`
    }
    return memoryString
  }

  // Prepare data for CPU chart
  

  // Prepare data for memory chart
  const memoryData = [
    {
      name: "Peak",
      value: Number.parseInt(dummyStats.memory.vmPeak.split(" ")[0]) / 1000, // Convert to MB for better visualization
    },
    {
      name: "Size",
      value: Number.parseInt(dummyStats.memory.vmSize.split(" ")[0]) / 1000,
    },
    {
      name: "RSS",
      value: Number.parseInt(dummyStats.memory.vmRSS.split(" ")[0]) / 1000,
    },
  ]
  
  

  // Helper function to render prediction indicator
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

  // Custom tooltip for charts
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Process Statistics</h2>
              <p className="text-slate-200 mt-1">
                PID: {dummyStats.pid} • Port: {dummyStats.port}
              </p>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-full text-sm">Active</div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="w-full">
            {/* Tab List */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === "cpu" ? "border-b-2 border-slate-700 text-slate-800" : "text-slate-500"}`}
                onClick={() => setActiveTab("cpu")}
              >
                CPU Usage
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "memory" ? "border-b-2 border-slate-700 text-slate-800" : "text-slate-500"}`}
                onClick={() => setActiveTab("memory")}
              >
                Memory Usage
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "disk" ? "border-b-2 border-slate-700 text-slate-800" : "text-slate-500"}`}
                onClick={() => setActiveTab("disk")}
              >
                Disk Usage
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "network" ? "border-b-2 border-slate-700 text-slate-800" : "text-slate-500"}`}
                onClick={() => setActiveTab("network")}
              >
                Network Usage
              </button>
            </div>

            {/* Tab Content - CPU */}
            {activeTab === "cpu" && (
              <CPU/>
            )}

            {/* Tab Content - Memory */}
            {activeTab === "memory" && (
              <Memory/>
            )}

            {/* Tab Content - Disk */}
            {activeTab === "disk" && (
              <Disk/>
            )}
            {/* Tab Content - Network*/}
            {activeTab === "network" && (
              <Network/>
            )}
          </div>
        </div>
      </div>
    </div>
  ) 
}

export default ProcessStat

