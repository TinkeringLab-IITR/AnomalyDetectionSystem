"use client"

import { useState } from "react"
import Network from "./Network"
import CPU from "./CPU"
import Memory from "./Memory"
import Disk from "./Disk"
import { useWebSocket } from "../app/websockets"

const ProcessStat = ({ pid }) => {
  const [activeTab, setActiveTab] = useState("cpu")
  const { dataByPid, isConnected } = useWebSocket()

  // Get data for this specific PID
  const stats = dataByPid?.[pid]

  // Check if data exists for the given PID
  const isDataReady = stats && Object.keys(stats).length > 0
  // In ProcessStat component:
// console.log("dataByPid:", dataByPid);
// console.log("stats for this PID:", stats);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Process Statistics</h2>
              <p className="text-slate-200 mt-1">
                PID: {pid}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isDataReady ? (
            <div className="text-center text-slate-500 py-12">Loading stats for PID {pid}...</div>
          ) : (
            <>
              <div className="flex border-b mb-6">
                {["cpu", "memory", "disk", "network"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 font-medium ${
                      activeTab === tab
                        ? "border-b-2 border-slate-700 text-slate-800"
                        : "text-slate-500"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Usage
                  </button>
                ))}
              </div>

              {activeTab === "cpu" && <CPU metrics={{cpu: stats?.cpu}} />}
              {activeTab === "memory" && <Memory metrics={{memory: stats?.memory}} />}
              {activeTab === "disk" && <Disk metrics={{disk: stats?.disk}} />}
              {activeTab === "network" && <Network metrics={{network: stats?.network}} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProcessStat