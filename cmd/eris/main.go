package main

import (
	"fmt"
	"os"
	"path/filepath"

	"eris/internal/collector/metrics"
	"eris/internal/collector/network"
	"eris/internal/collector/plugins"
	"eris/internal/utils"

	"github.com/spf13/cobra"
)

func main() {
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

			select {}
		},
	}

	rootCmd.Flags().StringVarP(&configPath, "path", "p", "", "Path to the configuration file (optional, defaults to .eris.yaml in current directory)")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
