package metrics

import (
	"fmt"
	"sync"
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
	var wg sync.WaitGroup
	
	ticker := time.NewTicker(time.Duration(config.Interval) * time.Second)
	defer ticker.Stop()
	//wg.Add(3)
	for range ticker.C {
		for _, source := range config.Sources {
			switch source.Type {
			case "cpu":
				wg.Add(1) 
				go func(){ 
					defer wg.Done()
					getCPUMetrics(pids)
				}()
			case "memory":
				wg.Add(1)
				go func(){ 
					defer wg.Done()
					getMemoryMetrics(pids)
				}()
			case "disk":
					wg.Add(1)
					go func(){ 
						defer wg.Done()
						getDiskMetrics(pids)
				}()
			default:
				fmt.Printf("Unknown metric type: %s\n", source.Type)
			}
		}
	}
	wg.Wait()
}
