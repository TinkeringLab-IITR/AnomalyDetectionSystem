package metrics

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	
)

func getMemoryMetrics(pids map[int]int) {
	fmt.Println("Collecting Memory usage")
	for port, pid := range pids {
		// data,err := ioutil.ReadFile(fmt.Sprintf("/proc/%d/stat",pid))
		fmt.Printf("Collecting Memory metrics for pid : %d, port:%d \n", pid, port)
		Memstat, err := GetMemStat(pid)
		if err != nil {
			//intentionally empty
		}
		for stat, mem := range Memstat {
			fmt.Printf("%s : %d KB \n", stat, mem)
		}

	}
	
}

func GetMemStat(pid int) (map[string]int, error) {
	statfpath := fmt.Sprintf("/proc/%d/status", pid)
	data, err := os.ReadFile(statfpath)
	if err != nil {
		log.Println(fmt.Errorf("could not read file path for pid : %d", pid)) // unnecessary
	}
	memstat := make(map[string]int)
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		//VmRSS = physical VmSize = Total VmPeak = peak mem usage
		if strings.HasPrefix(line, "VmRSS") || strings.HasPrefix(line, "VmSize") || strings.HasPrefix(line, "VmPeak") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				memval, err := strconv.Atoi(parts[1])
				if err != nil {
					continue
				}
				memstat[parts[0]] = memval
			}
		}
	}
	return memstat, nil

}

func GetVmRSS(pid int) float64 {
	statfpath := fmt.Sprintf("/proc/%d/status", pid)
	data, err := os.ReadFile(statfpath)
	if err != nil {
		return 0.0
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "VmRSS") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				memval, err := strconv.Atoi(parts[1])
				if err != nil {
					return 0.0
				}
				return float64(memval) 
			}
		}
	}

	return 0.0
}

