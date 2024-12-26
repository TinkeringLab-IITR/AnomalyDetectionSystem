package utils

import (
    "fmt"
    "gopkg.in/yaml.v3"
    "io/ioutil"
    "os"
)

type Config struct {
    Project struct {
        Name        string `yaml:"name"`
        Description string `yaml:"description"`
        Owner       string `yaml:"owner"`
        Environment string `yaml:"environment"`
    } `yaml:"project"`
    Process struct {
        Ports []int `yaml:"port"`
    } `yaml:"process"`
    Metrics struct {
        Enabled  bool   `yaml:"enabled"`
        Interval int    `yaml:"interval"`
        Sources  []struct {
            Type    string `yaml:"type"`
            Command string `yaml:"command,omitempty"`
        } `yaml:"sources"`
    } `yaml:"metrics"`
    Network struct {
        Enabled        bool     `yaml:"enabled"`
        CapturePackets bool     `yaml:"capture_packets"`
        Protocols      []string `yaml:"protocols"`
    } `yaml:"network"`
    Plugins struct {
        Enabled bool `yaml:"enabled"`
        List    []struct {
            Name   string `yaml:"name"`
            Config struct {
                Host             string `yaml:"host,omitempty"`
                Port             int    `yaml:"port,omitempty"`
                Type             string `yaml:"type,omitempty"`
                ConnectionString string `yaml:"connection_string,omitempty"`
            } `yaml:"config"`
        } `yaml:"list"`
    } `yaml:"plugins"`
}

func ParseConfig(path string) (*Config, error) {
    file, err := os.Open(path)
    if err != nil {
        return nil, fmt.Errorf("error opening file: %w", err)
    }
    defer file.Close()

    data, err := ioutil.ReadAll(file)
    if err != nil {
        return nil, fmt.Errorf("error reading file: %w", err)
    }

    var config Config
    if err := yaml.Unmarshal(data, &config); err != nil {
        return nil, fmt.Errorf("error parsing YAML: %w", err)
    }
	//!TODO: check if the configuration is valid

    return &config, nil
}
