package network

import "fmt"

type NetworkConfig struct {
	Enabled        bool
	CapturePackets bool
	Protocols      []string
}

func StartNetworkTracing(config NetworkConfig,pids map[int]int) {
	if !config.Enabled {
		fmt.Println("Network tracing is disabled.")
		return
	}

	fmt.Println("Starting network tracing...")
	for _, protocol := range config.Protocols {
		fmt.Printf("Observing protocol: %s\n", protocol)
	}
	if config.CapturePackets {
		fmt.Println("Packet capture is enabled.")
	}
}
