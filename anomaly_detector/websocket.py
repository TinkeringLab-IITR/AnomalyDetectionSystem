import asyncio
import json
import logging
import websockets
from datetime import datetime
import grpc
import outliers_pb2 as pb2
import outliers_pb2_grpc as pb2_grpc
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Store connected clients
connected_clients = set()

# Store historical data for new connections
historical_data = defaultdict(list)
MAX_HISTORY = 100  # Maximum number of historical data points to keep

class OutliersClient:
    def __init__(self, server_address):
        self.channel = grpc.insecure_channel(server_address)
        self.stub = pb2_grpc.OutliersStub(self.channel)
        
    def detect_anomalies(self, metrics):
        """Send metrics to the gRPC server for anomaly detection."""
        request = pb2.OutliersRequest(metrics=metrics)
        try:
            response = self.stub.Detect(request)
            return response
        except grpc.RpcError as e:
            logger.error(f"RPC error: {e}")
            return None

# Create gRPC client
outliers_client = OutliersClient('localhost:9999')

async def broadcast_message(message):
    """Broadcast a message to all connected clients."""
    if connected_clients:
        await asyncio.gather(
            *[client.send(message) for client in connected_clients],
            return_exceptions=True
        )

# Fix: Removed the 'path' parameter since newer websockets versions don't use it
async def handle_metric_data(websocket):
    """Handle WebSocket connection from clients."""
    connected_clients.add(websocket)
    client_id = id(websocket)
    logger.info(f"New client connected: {client_id}. Total clients: {len(connected_clients)}")
    
    # Send historical data to new client
    for data_point in historical_data['metrics'][-MAX_HISTORY:]:
        await websocket.send(json.dumps(data_point))
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                
                # Expected format: {"pid": 123, "metric_type": "CPU", "value": 75.5}
                if all(k in data for k in ['pid', 'metric_type', 'value']):
                    pid = data['pid']
                    metric_type = data['metric_type']
                    value = float(data['value'])
                    
                    # Convert metric_type string to enum value
                    metric_type_enum = getattr(pb2.MetricType, metric_type)
                    
                    # Create metric for gRPC request
                    metric = pb2.Metric(
                        pid=pid,
                        metrictype=metric_type_enum,
                        value=value
                    )
                    
                    # Get prediction from gRPC server
                    response = outliers_client.detect_anomalies([metric])
                    
                    if response:
                        # Process each prediction
                        for prediction in response.prediction:
                            result = {
                                'timestamp': datetime.now().isoformat(),
                                'raw_data': {
                                    'pid': pid,
                                    'metric_type': metric_type,
                                    'value': value
                                },
                                'prediction': {
                                    'pid': prediction.pid,
                                    'type': pb2.MetricType.Name(prediction.type),
                                    'result': prediction.result,
                                    'status': 'Anomaly' if prediction.result == -1 else 'Normal'
                                }
                            }
                            
                            # Store in historical data
                            historical_data['metrics'].append(result)
                            if len(historical_data['metrics']) > MAX_HISTORY:
                                historical_data['metrics'].pop(0)
                            
                            # Broadcast to all clients
                            await broadcast_message(json.dumps(result))
                else:
                    logger.warning(f"Invalid data format received: {data}")
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {message}")
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Connection closed for client {client_id}")
    finally:
        connected_clients.remove(websocket)
        logger.info(f"Client {client_id} disconnected. Remaining clients: {len(connected_clients)}")

async def start_websocket_server():
    """Start the WebSocket server."""
    host = '0.0.0.0'
    port = 8765
    
    # Initialize history array
    historical_data['metrics'] = []
    
    # Start the WebSocket server - Fix: Updated server creation syntax
    async with websockets.serve(handle_metric_data, host, port):
        logger.info(f"WebSocket server started on ws://{host}:{port}")
        
        # Keep the server running
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(start_websocket_server())
    except KeyboardInterrupt:
        logger.info("Server shutting down")