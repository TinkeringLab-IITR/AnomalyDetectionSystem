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
package network

import "fmt"

type NetworkConfig struct {
	Enabled        bool
	CapturePackets bool
	Protocols      []string
}
//Collecting network metrics through PID
func StartNetworkTracing(config NetworkConfig, pids map[int]int) { 
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

	for port, pid := range pids {
		fmt.Printf("Collecting network metrics for PID: %d (Port: %d)\n", pid, port)

		netStats, err := GetNetworkStats(pid)
		if err != nil {
			fmt.Printf("Error retrieving network stats for PID %d: %v\n", pid, err)
			continue
		}

		for key, value := range netStats {
			fmt.Printf("%s: %d\n", key, value)
		}
	}
}

func GetNetworkStats(pid int) (map[string]int64, error) {
	stats := make(map[string]int64)

	// Path to process-specific network file
	netFile := fmt.Sprintf("/proc/%d/net/dev", pid)

	// Read network statistics
	data, err := os.ReadFile(netFile)
	if err != nil {
		log.Printf("Could not read network file for PID %d: %v", pid, err)
		return nil, err
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.Contains(line, "eth0") || strings.Contains(line, "wlan0") { // Adjust based on active interface
			fields := strings.Fields(line)
			if len(fields) >= 10 {
				// Extract relevant metrics: bytes received & transmitted
				recvBytes, _ := strconv.ParseInt(fields[1], 10, 64) // Bytes received
				transBytes, _ := strconv.ParseInt(fields[9], 10, 64) // Bytes transmitted

				stats["BytesReceived"] = recvBytes
				stats["BytesTransmitted"] = transBytes
			}
		}
	}

	
	connCount, err := GetActiveConnections(pid)
	if err == nil {
		stats["ActiveConnections"] = connCount
	}

	return stats, nil
}


func GetActiveConnections(pid int) (int64, error) {
	tcpFile := fmt.Sprintf("/proc/%d/net/tcp", pid)

	data, err := os.ReadFile(tcpFile)
	if err != nil {
		log.Printf("Could not read TCP connections file for PID %d: %v", pid, err)
		return 0, err
	}

	lines := strings.Split(string(data), "\n")
	connectionCount := int64(len(lines) - 1) // Exclude header line

	return connectionCount, nil
}

	fmt.Println("Starting network tracing...")
	for _, protocol := range config.Protocols {
		fmt.Printf("Observing protocol: %s\n", protocol)
	}
	if config.CapturePackets {
		fmt.Println("Packet capture is enabled.")
	}
}
