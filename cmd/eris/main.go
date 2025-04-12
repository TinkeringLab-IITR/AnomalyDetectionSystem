package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"eris/internal/collector/metrics"
	"eris/internal/collector/network"
	"eris/internal/collector/plugins"
	"eris/internal/utils"

	"eris/pb"
	"google.golang.org/grpc/keepalive"
	"github.com/gorilla/websocket"
	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pbtime "google.golang.org/protobuf/types/known/timestamppb"
)

// WebSocketMessage represents the structure of data to be sent to the websocket server
type WebSocketMessage struct {
	PID        int     `json:"pid"`
	MetricType string  `json:"metric_type"`
	Value      float64 `json:"value"`
	SubType    string  `json:"sub_type,omitempty"`
	Prediction int32   `json:"prediction,omitempty"` // Added prediction field
}

// CPUMetric is used to track CPU metrics with their subtypes
type CPUMetric struct {
	Value   float64
	SubType string
}

func main() {
	grpcAddr := "localhost:9999"
	wsAddr := "ws://localhost:8765"
	
	// Set up gRPC connection
	conn, err := grpc.Dial(grpcAddr, 
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                10 * time.Second, // Send pings every 10 seconds if there is no activity
			Timeout:             5 * time.Second,  // Wait 5 seconds for ping ack before considering the connection dead
			PermitWithoutStream: true,             // Send pings even without active streams
		}))
	if err != nil {
		log.Fatal("Failed to connect to gRPC server:", err)
	}
	defer conn.Close()

	client := pb.NewOutliersClient(conn)
	
	// Set up websocket connection
	u, err := url.Parse(wsAddr)
	if err != nil {
		log.Fatal("Failed to parse WebSocket URL:", err)
	}
	
	// Create WebSocket connection
	wsConn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Println("Warning: Failed to connect to WebSocket server:", err)
		// Continue execution even if WebSocket fails - we'll try to reconnect later
	} else {
		log.Println("Connected to WebSocket server at", wsAddr)
		defer wsConn.Close()
	}
	
	var configPath string

	var rootCmd = &cobra.Command{
		Use:   "eris",
		Short: "Eris - A non-intrusive observability tool for CRUD web applications",
		Run: func(cmd *cobra.Command, args []string) {
			if cmd.Flags().Changed("path") {
				if configPath == "" {
					fmt.Println("Error: --path flag used but no path provided.")
					cmd.Usage()
					os.Exit(1)
				}
			} else {
				currentDir, err := os.Getwd()
				if err != nil {
					fmt.Println("Error: Unable to get current directory.")
					os.Exit(1)
				}
				configPath = filepath.Join(currentDir, ".eris.yaml")
			}

			config, err := utils.ParseConfig(configPath)
			if err != nil {
				fmt.Printf("Error parsing configuration: %v\n", err)
				os.Exit(1)
			}

			pids := make(map[int]int)
			for _, port := range config.Process.Ports {
				pid, err := utils.ResolvePIDFromPort(port)
				if err != nil {
					fmt.Printf("Error resolving PID for port %d: %v\n", port, err)
					continue
				}
				pids[port] = pid
			}
			fmt.Printf("Resolved PIDs: %+v\n", pids)

			metricsConfig := metrics.MetricsConfig{
				Enabled:  config.Metrics.Enabled,
				Interval: config.Metrics.Interval,
				Sources:  make([]metrics.Source, len(config.Metrics.Sources)),
			}
			for i, src := range config.Metrics.Sources {
				metricsConfig.Sources[i] = metrics.Source{
					Type:    src.Type,
					Command: src.Command,
				}
			}

			networkConfig := network.NetworkConfig{
				Enabled:        config.Network.Enabled,
				CapturePackets: config.Network.CapturePackets,
				Protocols:      config.Network.Protocols,
				Interval:       config.Metrics.Interval,
			}

			pluginsConfig := plugins.PluginsConfig{
				Enabled: config.Plugins.Enabled,
				List:    make([]plugins.PluginConfig, len(config.Plugins.List)),
			}
			for i, plugin := range config.Plugins.List {
				pluginConfig := make(map[string]interface{})
				if plugin.Config.Host != "" {
					pluginConfig["host"] = plugin.Config.Host
				}
				if plugin.Config.Port != 0 {
					pluginConfig["port"] = plugin.Config.Port
				}
				if plugin.Config.Type != "" {
					pluginConfig["type"] = plugin.Config.Type
				}
				if plugin.Config.ConnectionString != "" {
					pluginConfig["connection_string"] = plugin.Config.ConnectionString
				}

				pluginsConfig.List[i] = plugins.PluginConfig{
					Name:   plugin.Name,
					Config: pluginConfig,
				}
			}

			go metrics.StartMetricsCollection(metricsConfig, pids)
			go network.StartNetworkTracing(networkConfig, pids)
			go plugins.LoadPlugins(pluginsConfig, pids)

			if !metricsConfig.Enabled {
				fmt.Println("Metrics collection is disabled.")
				return
			}
			
			ticker := time.NewTicker(time.Duration(metricsConfig.Interval) * time.Second)
			defer ticker.Stop()
			
			for range ticker.C {
				for _, pid := range pids {
					go func(pid int) {
						// 1. Collect metrics for gRPC
						metrics := send_metrics_to_server(pid)
						
						// 2. Send to gRPC server for anomaly detection
						req := pb.OutliersRequest{
							Metrics: metrics,
						}
			
						resp, err := client.Detect(context.Background(), &req)
						if err != nil {
							log.Printf("Error sending data for PID %d to gRPC server: %v", pid, err)
							return
						}
						
						// 3. Get and process predictions
						predictions := make(map[pb.MetricType]int32)
						for _, pred := range resp.Prediction {
							log.Printf("PID %d - %s prediction: %v",
								pred.Pid,
								pb.MetricType_name[int32(pred.Type)],
								pred.Result)
							
							predictions[pred.Type] = pred.Result
						}
						
						// 4. Get metrics for WebSocket with the same format and CPU sub-metrics
						wsMetrics, cpuSubMetrics := send_metrics_to_websocket_with_subtypes(pid)
						
						// 5. Try to reconnect if WebSocket is disconnected
						if wsConn == nil || wsConn.WriteMessage(websocket.PingMessage, nil) != nil {
							log.Println("Attempting to reconnect to WebSocket server...")
							wsConn, _, err = websocket.DefaultDialer.Dial(u.String(), nil)
							if err != nil {
								log.Println("Failed to reconnect to WebSocket server:", err)
								return
							}
							log.Println("Successfully reconnected to WebSocket server")
						}
						
						// 6. Send each metric with its prediction to WebSocket
						for _, metric := range wsMetrics {
							// Get prediction for this metric type if available
							prediction, hasPrediction := predictions[metric.Metrictype]
							
							// Create message for WebSocket
							wsMessage := WebSocketMessage{
								PID:        int(metric.Pid),
								MetricType: pb.MetricType_name[int32(metric.Metrictype)],
								Value:      metric.Value,
							}
							
							// Add SubType if this is a CPU metric
							if metric.Metrictype == pb.MetricType_CPU {
								// Find the matching CPU metric in our submetrics map
								for _, cpuMetric := range cpuSubMetrics {
									if cpuMetric.Value == metric.Value {
										wsMessage.SubType = cpuMetric.SubType
										break
									}
								}
								// If no specific subtype was found, it's the total CPU time
								if wsMessage.SubType == "" {
									wsMessage.SubType = "total"
								}
							}
							
							// Add prediction if available
							if hasPrediction {
								wsMessage.Prediction = prediction
							}
							
							// Marshal to JSON
							jsonMsg, err := json.Marshal(wsMessage)
							if err != nil {
								log.Printf("Error marshaling WebSocket message: %v", err)
								continue
							}
							
							// Send to WebSocket
							err = wsConn.WriteMessage(websocket.TextMessage, jsonMsg)
							if err != nil {
								log.Printf("Error sending to WebSocket: %v", err)
								wsConn = nil  // Mark for reconnection on next iteration
								break
							} else {
								log.Printf("Sent metric data to WebSocket: %s", string(jsonMsg))
							}
						}
					}(pid)
				}
			}

			select {}
		},
	}

	rootCmd.Flags().StringVarP(&configPath, "path", "p", "", "Path to the configuration file (optional, defaults to .eris.yaml in current directory)")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func send_metrics_to_server(pid int) []*pb.Metric {
	t := time.Now()
	_, _, _, _, totalCPUTime := metrics.GetCPUUsage(pid) // Assuming GetCPUUsage returns these values
	return []*pb.Metric{
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      totalCPUTime,
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_MEMORY,
			Pid:        int32(pid),
			Value:      metrics.GetVmRSS(pid),
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_DISK,
			Pid:        int32(pid),
			Value:      metrics.GetDiskUsage(pid),
		},
	}
}

// Modified function that returns both metrics and CPU sub-metrics with their types
func send_metrics_to_websocket_with_subtypes(pid int) ([]*pb.Metric, []CPUMetric) {
	t := time.Now()
	utime, stime, cutime, cstime, totalCPUTime := metrics.GetCPUUsage(pid)
	
	// Create CPU submetrics with their types for later reference
	cpuSubMetrics := []CPUMetric{
		{Value: float64(utime), SubType: "utime"},
		{Value: float64(stime), SubType: "stime"},
		{Value: float64(cutime), SubType: "cutime"},
		{Value: float64(cstime), SubType: "cstime"},
		{Value: totalCPUTime, SubType: "total"},
	}
	
	metrics := []*pb.Metric{
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      totalCPUTime,
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_MEMORY,
			Pid:        int32(pid),
			Value:      metrics.GetVmRSS(pid),
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_DISK,
			Pid:        int32(pid),
			Value:      metrics.GetDiskUsage(pid),
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      float64(utime), // Sending utime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      float64(stime), // Sending stime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      float64(cutime), // Sending cutime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CPU,
			Pid:        int32(pid),
			Value:      float64(cstime), // Sending cstime
		},
	}
	
	return metrics, cpuSubMetrics
}

// Keep the original function for backward compatibility
func send_metrics_to_websocket(pid int) []*pb.Metric {
	metrics, _ := send_metrics_to_websocket_with_subtypes(pid)
	return metrics
}

// Timestamp converts time.Time to protobuf *Timestamp
func Timestamp(t time.Time) *pbtime.Timestamp {
    return &pbtime.Timestamp{
        Seconds: t.Unix(),
        Nanos:   int32(t.Nanosecond()),
    }
}