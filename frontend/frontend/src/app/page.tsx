// stats/page.js
"use client"
import Link from "next/link"
import { useWebSocket } from "../app/websockets"

export default function StatsIndex() {
  const { dataByPid } = useWebSocket();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available PIDs</h1>
      <ul className="space-y-2">
        {Object.keys(dataByPid).map(pid => (
          <li key={pid}>
            <Link href={`/stats/${pid}`} className="text-blue-600 hover:underline">
              View Stats for PID {pid}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

