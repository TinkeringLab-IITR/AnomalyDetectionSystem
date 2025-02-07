package metrics

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func getDiskMetrics(pids map[int]int) {
	for port, pid := range pids {
		fmt.Printf("Collecting disk metrics for pid : %d, port:%d \n", pid, port)
		DiskUsage, err := getDiskUsage(pid)
		if err != nil {
			fmt.Printf("Exiting")
		}
		fmt.Printf("Dis Usage : %d bytes \n", DiskUsage)
	}
}

func getDiskUsage(pid int) (int64, error) {
	var procid int64 = int64(pid)
	procDisk := fmt.Sprintf("/proc/%d/fd", procid)
	fmt.Printf("Attempting to collect disk usage for pid : %d \n", pid)
	files, err := os.ReadDir(procDisk)
	if err != nil {
		return 0, fmt.Errorf("could not read proc fd for pid %d ", procid)
	}
	var totalDiskUsage int64
	for _, file := range files {
		procPath := filepath.Join(procDisk, file.Name())
		target, err := os.Readlink(procPath)
		if err != nil {
			return 0, fmt.Errorf("could not read links for pid : %d ", procid)
		}
		if strings.HasPrefix(target, "/") {
			info, err := os.Stat(target)
			if err != nil {
				// return 0,fmt.Errorf("could not find stat continuing")
				continue
			}
			totalDiskUsage += info.Size()
		}
	}
	return totalDiskUsage, nil
}
