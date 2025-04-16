"use client"

import { useState } from "react"
import Network from "./Network"
import CPU from "./CPU"
import Memory from "./Memory"
import Disk from "./Disk"
import { useWebSocket } from "../app/websockets"
import { Cpu, Database, HardDrive, Share2 } from "lucide-react"

const ProcessStat = ({ pid }) => {
  const [activeTab, setActiveTab] = useState("cpu")
  const { dataByPid, isConnected } = useWebSocket()

  // Get data for this specific PID
  const stats = dataByPid?.[pid]

  // Check if data exists for the given PID
  const isDataReady = stats && Object.keys(stats).length > 0

  // Tab configuration with icons
  const tabs = [
    { id: "cpu", label: "CPU", icon: <Cpu className="w-5 h-5 mr-2" /> },
    { id: "memory", label: "MEMORY", icon: <Database className="w-5 h-5 mr-2" /> },
    { id: "disk", label: "DISK", icon: <HardDrive className="w-5 h-5 mr-2" /> },
    { id: "network", label: "NETWORK", icon: <Share2 className="w-5 h-5 mr-2" /> }
  ]

  return (
    <div className="fixed inset-0 bg-black text-green-400 flex flex-col">
      {/* Header */}
      <div className="bg-black text-green-400 p-4 border-b border-green-500/50 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, #00ff00 1px, transparent 1px), linear-gradient(to bottom, #00ff00 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        
        <div className="flex justify-between items-center relative">
          <div>
            <h2 className="text-2xl font-bold font-mono">PROCESS MONITOR</h2>
            <p className="text-green-400 mt-1 font-mono">
              PID: <span className="text-green-500">{pid}</span> | STATUS: <span className="text-green-500">ACTIVE</span>
            </p>
          </div>
          <div className={`px-3 py-1 rounded font-mono text-sm ${isConnected ? 'bg-green-900 text-green-400 border border-green-500' : 'bg-red-900 text-red-400 border border-red-500'}`}>
            {isConnected ? '█ CONNECTED' : '▢ DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Main content area with left sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with tabs */}
        <div className="w-48 border-r border-green-500/30 bg-black flex flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-4 font-medium ${
                activeTab === tab.id
                  ? "bg-green-900/30 text-green-400 border-l-4 border-green-500"
                  : "text-green-500/60 hover:text-green-400 hover:bg-green-900/20"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto bg-black font-mono">
          {!isDataReady ? (
            <div className="text-center py-12 h-full flex items-center justify-center">
              <div className="inline-block relative">
                <span className="animate-pulse">Loading stats for PID {pid}...</span>
                <span className="animate-blink ml-1">▌</span>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {activeTab === "cpu" && <CPU metrics={{cpu: stats?.cpu}} />}
              {activeTab === "memory" && <Memory metrics={{memory: stats?.memory}} />}
              {activeTab === "disk" && <Disk metrics={{disk: stats?.disk}} />}
              {activeTab === "network" && <Network metrics={{network: stats?.network}} />}
            </div>
          )}
        </div>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  )
}

export default ProcessStat