APP_NAME = eris
CMD_DIR = ./cmd/$(APP_NAME)
BUILD_DIR = ./bin
MAIN_FILE = $(CMD_DIR)/main.go

build:
	@echo "Building $(APP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_FILE)
	@echo "Build complete: $(BUILD_DIR)/$(APP_NAME)"

clean:
	@echo "Cleaning up..."
	@rm -rf $(BUILD_DIR)
	@echo "Cleanup complete."

run: build
	@echo "Running $(APP_NAME)..."
	@$(BUILD_DIR)/$(APP_NAME)

lint:
	@echo "Running lint checks..."
	@golangci-lint run

# Default target
default: build
