"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

// Create the context
const WebSocketContext = createContext(null);

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// WebSocket Provider component
export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [metrics, setMetrics] = useState({
    cpu: {
      values: [],
      status: 'Normal',
      latestValue: null,
    },
    memory: {
      values: [],
      status: 'Normal',
      latestValue: null,
    },
    disk: {
      values: [],
      status: 'Normal',
      latestValue: null,
    },
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8765');
  
    websocket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };
  
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data:', data);
        
        setLastMessage(data);
  
        // Update metrics state based on the received data format
        if (data && data.metric_type) {
          const metricType = data.metric_type.toLowerCase();
          const value = data.value;
          const status = data.status || (data.prediction === -1 ? 'Anomaly' : 'Normal');
          const timestamp = data.timestamp || new Date().toISOString();
          const subType = data.sub_type || null;
  
          setMetrics(prevMetrics => {
            // Handle the case when metricType exists in prevMetrics
            if (prevMetrics[metricType]) {
              // Create a new data point
              const newDataPoint = {
                value,
                timestamp,
                status,
                subType
              };
  
              // Get current values array
              const currentValues = prevMetrics[metricType].values;
              
              // Add new point and keep only the last 50 points
              const updatedValues = [...currentValues, newDataPoint].slice(-50);
  
              return {
                ...prevMetrics,
                [metricType]: {
                  values: updatedValues,
                  status,
                  latestValue: value,
                  subType
                }
              };
            }
            return prevMetrics; // Return unchanged if metricType doesn't exist
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  
    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      const reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect...');
        // Cleanup will run on unmount, but we need to reset the WebSocket
        setSocket(null);
        // The effect will run again due to the dependency change
      }, 5000);
      
      return () => clearTimeout(reconnectTimeout);
    };
  
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    setSocket(websocket);
  
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Function to send data to the WebSocket server
  const sendMessage = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  // Send test data for a specific metric type
  const sendTestData = (metricType, value = null) => {
    const pid = 840; // Default PID
    
    // Generate a reasonable value if none provided
    let metricValue = value;
    if (metricValue === null) {
      switch (metricType.toUpperCase()) {
        case 'CPU':
          metricValue = Math.floor(Math.random() * 2000) + 14000;
          break;
        case 'MEMORY':
          metricValue = Math.floor(Math.random() * 10000) + 630000;
          break;
        case 'DISK':
          metricValue = Math.floor(Math.random() * 1000) + 23000;
          break;
        default:
          metricValue = 0;
      }
    }
    
    sendMessage({
      pid,
      metric_type: metricType.toUpperCase(),
      value: metricValue
    });
  };

  // Context value
  const value = {
    socket,
    isConnected,
    lastMessage,
    metrics,
    sendMessage,
    sendTestData
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
