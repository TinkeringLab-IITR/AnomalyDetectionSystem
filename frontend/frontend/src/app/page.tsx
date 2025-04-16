"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useWebSocket } from "../app/websockets"
import { Activity } from "lucide-react"

interface DataByPid {
  [pid: string]: any
}

export default function StatsIndex() {
  const { dataByPid, isConnected } = useWebSocket() as { 
    dataByPid: DataByPid, 
    isConnected: boolean 
  }
  
  const [isLoading, setIsLoading] = useState(true)
  const [welcomeText, setWelcomeText] = useState("")
  const fullWelcomeText = "INITIALIZING SYSTEM MONITOR... WELCOME USER"

  useEffect(() => {
    // Typewriter effect for welcome message
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullWelcomeText.length) {
        setWelcomeText(fullWelcomeText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        // After typing completes, wait a bit then remove loading screen
        setTimeout(() => {
          setIsLoading(false)
        }, 800)
      }
    }, 50)

    return () => {
      clearInterval(typingInterval)
    }
  }, [])

  // Loading screen with animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex flex-col justify-center items-center">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, #00ff00 1px, transparent 1px), linear-gradient(to bottom, #00ff00 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        
        <div className="text-center font-mono">
          <div className="text-4xl mb-8">
            {welcomeText}
            <span className="animate-blink">▌</span>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xl">ACCESSING SYSTEM DATA...</div>
            <div className="text-sm mt-2 text-green-500/70">
              {Math.floor(Math.random() * 100)}% COMPLETE
            </div>
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

  // Main content after loading
  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col">
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
            <h1 className="text-2xl font-bold font-mono">PROCESS MONITOR</h1>
            <p className="text-green-400 mt-1 font-mono">
              STATUS: <span className="text-green-500">SCANNING</span>
            </p>
          </div>
          <div className={`px-3 py-1 rounded font-mono text-sm ${isConnected ? 'bg-green-900 text-green-400 border border-green-500' : 'bg-red-900 text-red-400 border border-red-500'}`}>
            {isConnected ? '█ CONNECTED' : '▢ DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 relative">
        {/* Grid background continued */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(to right, #00ff00 1px, transparent 1px), linear-gradient(to bottom, #00ff00 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        
        <div className="relative">
          <div className="border border-green-500/30 p-4 mb-6 bg-black/80">
            <h2 className="text-xl font-mono mb-2 flex items-center">
              <Activity className="mr-2 w-5 h-5" /> ACTIVE PROCESSES
            </h2>
            
            {Object.keys(dataByPid).length === 0 ? (
              <div className="text-green-500/60 font-mono py-4">
                <span className="animate-blink mr-1">▌</span>
                No active processes detected. Scanning system...
              </div>
            ) : (
              <ul className="space-y-2 font-mono">
                {Object.keys(dataByPid).map(pid => (
                  <li key={pid} className="border-b border-green-500/20 pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-green-500">PID:</span> {pid}
                      </div>
                      <Link
                        href={`/stats/${pid}`}
                        className="inline-block px-4 py-2 bg-green-900/40 text-green-400 border border-green-500/50 hover:bg-green-900/60 transition font-mono"
                      >
                        &gt; MONITOR
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="text-green-500/60 font-mono text-sm">
            <span className="animate-blink">▌</span> Terminal ready. System monitoring active.
          </div>
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