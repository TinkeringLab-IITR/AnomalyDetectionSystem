package network

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type NetworkConfig struct {
	Enabled        bool
	CapturePackets bool
	Protocols      []string
}

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
		for _,pid := range pids {
			netUsage, err := ProcessNetUsage(pid)
			if err != nil {
				fmt.Printf("Error processing PID %d: %v\n", pid, err)
				continue
			}
			fmt.Printf("Network Usage for PID %d: %+v\n", pid, netUsage)
		}
	}
}

type NetworkUsage struct {
	InterfaceName string
	Received      uint64
	Transmitted   uint64
}

type PerProcessUsage struct {
	PID            int
	NetworkUsages  []NetworkUsage
}

func ProcessNetUsage(pid int) (PerProcessUsage, error) {
	netUsage := PerProcessUsage{PID: pid}

	conns, err := os.ReadDir(fmt.Sprintf("/proc/%d/net", pid))
	if err != nil {
		return netUsage, err
	}

	for _, conn := range conns {
		if conn.Name() == "dev" {
			file, err := os.Open(fmt.Sprintf("/proc/%d/net/dev", pid))
			if err != nil {
				return netUsage, err
			}
			defer file.Close()

			scanner := bufio.NewScanner(file)
			scanner.Scan()  // Skip header line
			scanner.Scan()  // Skip second header line

			for scanner.Scan() {
				fields := strings.Fields(scanner.Text())
				if len(fields) < 17 {
					continue
				}

				interfaceName := strings.TrimSuffix(fields[0], ":")
				rxBytes, _ := strconv.ParseUint(fields[1], 10, 64)
				txBytes, _ := strconv.ParseUint(fields[9], 10, 64)

				netUsage.NetworkUsages = append(netUsage.NetworkUsages, NetworkUsage{
					InterfaceName: interfaceName,
					Transmitted:   txBytes,
					Received:      rxBytes,
				})
			}
			break
		}
	}
	return netUsage, nil
}