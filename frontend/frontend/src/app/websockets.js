"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [dataByPid, setDataByPid] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8765");

    socketRef.current.onopen = () => setIsConnected(true);
    socketRef.current.onclose = () => setIsConnected(false);
    socketRef.current.onerror = () => setIsConnected(false);

    socketRef.current.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);
      // console.log("WebSocket received data:", incomingData);
      const { pid, metric_type, value, sub_type, prediction } = incomingData;
      
      // Format as expected by your components
      setDataByPid(prev => {
        // Create a new object to avoid reference issues
        const newData = { ...prev };
        
        // Initialize the PID entry if it doesn't exist
        if (!newData[pid]) {
          newData[pid] = {};
        }
        
        // Initialize the metric type entry if it doesn't exist
        const metricKey = metric_type.toLowerCase();
        if (!newData[pid][metricKey]) {
          newData[pid][metricKey] = {
            values: [],
            status: "Normal"
          };
        }
        
        // Add the new value
        newData[pid][metricKey].values.push({
          value,
          subType: sub_type,
          status: prediction === -1 ? "Anomaly" : "Normal"
        });
        
        // Update the overall status
        if (prediction === -1) {
          newData[pid][metricKey].status = "Anomaly";
        }
        
        return newData;
      });
    };
    
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendTestData = (type = "CPU") => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type }));
    }
  };

  return (
    <WebSocketContext.Provider value={{ dataByPid, isConnected, sendTestData }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};