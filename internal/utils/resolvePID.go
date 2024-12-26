package utils

import (
	"fmt"
	"os/exec"
	"strings"
	"strconv"
)

// ResolvePIDFromPort resolves the PID of the process running on a given port.
func ResolvePIDFromPort(port int) (int, error) {
	// Use a command or platform-specific logic to resolve the PID from the port.
	cmd := exec.Command("lsof", "-i", fmt.Sprintf(":%d", port))
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("error executing lsof: %w", err)
	}

	lines := strings.Split(string(output), "\n")
	if len(lines) < 2 {
		return 0, fmt.Errorf("no process found on port %d", port)
	}

	fields := strings.Fields(lines[1])
	if len(fields) < 2 {
		return 0, fmt.Errorf("unexpected lsof output for port %d", port)
	}

	pid, err := strconv.Atoi(fields[1])
	if err != nil {
		return 0, fmt.Errorf("invalid PID format: %w", err)
	}

	return pid, nil
}
