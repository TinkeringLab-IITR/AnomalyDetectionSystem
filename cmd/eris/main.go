package main

import (
	"context"
	"fmt"
	"log"
	// "net/http"
	"os"
	"path/filepath"
	"time"

	"eris/internal/collector/metrics"
	"eris/internal/collector/network"
	"eris/internal/collector/plugins"
	"eris/internal/utils"

	"eris/pb"
	// "github.com/gorilla/websocket"

	"github.com/spf13/cobra"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pbtime "google.golang.org/protobuf/types/known/timestamppb"
)

func main() {
	addr := "localhost:9999"
    conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := pb.NewOutliersClient(conn)
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
				Interval: 		config.Metrics.Interval,
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
						req := pb.OutliersRequest{
							Metrics: send_metrics_to_server(pid),
						}
			
						resp, err := client.Detect(context.Background(), &req)
						if err != nil {
							log.Printf("Error sending data for PID %d: %v", pid, err)
							return
						}
						for _, pred := range resp.Prediction {
							log.Printf("PID %d - %s prediction: %v",
								pred.Pid,
								pb.MetricType_name[int32(pred.Type)],
								pred.Result)
							
						
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

func send_metrics_to_websocket(pid int) []*pb.Metric {
	t := time.Now()
	utime, stime, cutime, cstime, totalCPUTime := metrics.GetCPUUsage(pid) // Assuming GetCPUUsage returns these values
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
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CUSTOM,
			Pid:        int32(pid),
			Value:      float64(utime), // Sending utime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CUSTOM,
			Pid:        int32(pid),
			Value:      float64(stime), // Sending stime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CUSTOM,
			Pid:        int32(pid),
			Value:      float64(cutime), // Sending cutime
		},
		{
			Time:       Timestamp(t),
			Metrictype: pb.MetricType_CUSTOM,
			Pid:        int32(pid),
			Value:      float64(cstime), // Sending cstime
		},
	}
}


// Timestamp converts time.Time to protobuf *Timestamp
func Timestamp(t time.Time) *pbtime.Timestamp {
    return &pbtime.Timestamp{
        Seconds: t.Unix(),
        Nanos:   int32(t.Nanosecond()),
    }
}
