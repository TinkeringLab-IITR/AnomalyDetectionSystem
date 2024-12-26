package utils

type MetricsConfigRaw struct{
	Enabled  bool   `yaml:"enabled"`
        Interval int    `yaml:"interval"`
        Sources  []struct {
            Type    string `yaml:"type"`
            Command string `yaml:"command,omitempty"`
        } `yaml:"sources"`
}

type MetricsConfig struct {
	Enabled  bool
	Interval int
	Sources  []Source
}

type Source struct {
	Type    string
	Command string
}

func formatMetricsConfig(config MetricsConfig) {

}