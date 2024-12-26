package plugins

import "fmt"

type PluginConfig struct {
	Name   string
	Config map[string]interface{}
}

type PluginsConfig struct {
	Enabled bool
	List    []PluginConfig
}

func LoadPlugins(config PluginsConfig,pids map[int]int) {
	if !config.Enabled {
		fmt.Println("Plugins are disabled.")
		return
	}

	for _, plugin := range config.List {
		fmt.Printf("Loading plugin: %s\n", plugin.Name)
	}
}
