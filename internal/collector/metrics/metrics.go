package metrics

import (
	"fmt"
	"time"
)

type MetricsConfig struct {
	Enabled  bool
	Interval int
	Sources  []Source
}

type Source struct {
	Type    string
	Command string
}

func StartMetricsCollection(config MetricsConfig, pids map[int]int) {
	if !config.Enabled {
		fmt.Println("Metrics collection is disabled.")
		return
	}

	ticker := time.NewTicker(time.Duration(config.Interval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		for _, source := range config.Sources {
			switch source.Type {
			case "cpu":
				getCPUMetrics(pids)
			case "memory":
				getMemoryMetrics(pids)
			case "disk":
				getDiskMetrics(pids)
			default:
				fmt.Printf("Unknown metric type: %s\n", source.Type)
			}
		}
	}
}
