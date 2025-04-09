"use client"

import { useState } from "react"
import Network from "./Network"
import CPU from "./CPU"
import Memory from "./Memory"
import Disk from "./Disk"
import { useWebSocket } from "../app/websockets"

const ProcessStat = () => {
  const [activeTab, setActiveTab] = useState("cpu")
  const { isConnected } = useWebSocket()

  const dummyStats = {
    pid: 840,
    port: 27121,
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
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
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