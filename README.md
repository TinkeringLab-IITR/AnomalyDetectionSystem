# Project Setup Guide

This README provides step-by-step instructions for setting up and running the project.

## Prerequisites

- Git
- Linux/WSL environment
- Go
- Python with virtualenv
- Node.js and npm

## Setup Instructions

### 1. Clone the Repository

```bash
git clone "https://github.com/TinkeringLab-IITR/AnomalyDetectionSystem"
cd AnomalyDetectionSystem
```

### 2. Check Available Ports

Run the following command to check for open ports:

```bash
ss -lntp
```

Take note of the port number that will be needed for the next step.

### 3. Configure YAML File

Rename the YAML template file to `.eris.yaml`:

```bash
mv eris.yaml.template .eris.yaml
```

Open the `.eris.yaml` file and update the port number with the one you identified in step 2:

```bash
nano .eris.yaml
```

### 4. Build the Project

Run the build command (specific to your project):

```bash
make build
```

This will automatically create a `bin` directory.

### 5. Move YAML Configuration

Copy your configured YAML file to the bin directory:

```bash
cp .eris.yaml bin/
```

### 6. Set Up Anomaly Detection Environment

Navigate to the anomaly detection directory and set up a Python virtual environment:

```bash
cd anomaly_detection
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the anomaly server
python anomaly_server.py
```

### 7. Run WebSockets Server

Open a new terminal and run:

```bash
cd anomaly_detection
source venv/bin/activate  # On Windows: venv\Scripts\activate
python websockets.py
```

### 8. Run the Go Backend

Open a new terminal and run:

```bash
cd cmd/eris
go run main.go --path ../../bin/.eris.yaml
```

### 9. Set Up Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend/frontend
npm install
```

### 10. Run the Frontend Development Server

In the same terminal:

```bash
npm run dev
```

## Accessing the Application

After completing all steps, you can access the application at `http://localhost:[PORT]` (where [PORT] is the port number used in your frontend configuration).

## Troubleshooting

If you encounter any issues:

- Ensure all required ports are available
- Check that all services are running in their respective terminals
- Verify that the `.eris.yaml` configuration is correct
- Review log outputs for any error messages
