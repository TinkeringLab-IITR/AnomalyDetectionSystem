package metrics

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

func getCPUMetrics(pids map[int]int) {
	fmt.Println("Collecting CPU usage...")
	for port, pid := range pids {
		// data,err := ioutil.ReadFile(fmt.Sprintf("/proc/%d/stat",pid))
		fmt.Printf("Collecting cpu metrics for pid : %d, port:%d \n", pid, port)
		GetCPUStat(pid)
	}

}

func GetCPUStat(pid int) {
	statFields, err := ReadStats(pid)
	if err != nil {
		log.Fatal(err)
	}
	utime, _ := strconv.ParseInt(statFields[13], 10, 64)  // User time
	stime, _ := strconv.ParseInt(statFields[14], 10, 64)  // System time
	cutime, _ := strconv.ParseInt(statFields[15], 10, 64) // Child user time
	cstime, _ := strconv.ParseInt(statFields[16], 10, 64) // Child system time

	totalCPUTime := utime + stime + cutime + cstime
	fmt.Printf("Process %d CPU stats:\n", pid)
	fmt.Printf("User time: %d seconds\n", utime)
	fmt.Printf("System time: %d seconds\n", stime)
	fmt.Printf("Child user time: %d seconds\n", cutime)
	fmt.Printf("Child system time: %d seconds\n", cstime)
	fmt.Printf("Total CPU time (user + system + child user + child system): %d seconds\n", totalCPUTime)
}

func ReadStats(pid int) ([]string, error) {
	procFile := fmt.Sprintf("/proc/%d/stat", pid)
	fmt.Println("Attempting to read:", procFile)
	if _, err := os.Stat(procFile); os.IsNotExist(err) {
		return nil, fmt.Errorf("process with PID %d does not exist or has terminated", pid)
	}
	data, err := os.ReadFile(procFile)
	if err != nil {
		return nil, err
	}
	fields := strings.Fields(string(data))
	return fields, nil
}

func ParseMilliSecTime(tm int64) time.Time {
	sec := tm / 1000
	msec := tm % 1000
	return time.Unix(sec, msec*int64(time.Millisecond))
}
