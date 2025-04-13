from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd
from datetime import datetime
import logging
from concurrent.futures import ThreadPoolExecutor
import grpc
from outliers_pb2 import OutliersResponse
from outliers_pb2_grpc import OutliersServicer, add_OutliersServicer_to_server
from collections import defaultdict
import outliers_pb2 as pb2

models = defaultdict(dict)          
data_store = defaultdict(lambda: defaultdict(list)) 

def train_model(data):
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(data)
    return model

def predict_anomaly(model, new_data_point):
    prediction = model.predict(new_data_point)
    return prediction[0]  # Returns 1 for normal, -1 for anomaly

# Function to handle CPU/Memory anomaly detection
def detect_anomaly(pid, metric_type, value):
    current_time = datetime.now()
    data_store[pid][metric_type].append({'time': current_time, 'value': value})
    data_size = len(data_store[pid][metric_type])

    df = pd.DataFrame(data_store[pid][metric_type])

    if data_size % 10 == 0:
        models[pid][metric_type] = train_model(df[['value']])
        print(f"Trained model for PID {pid}, metric {metric_type}, size: {data_size}")

    model = models[pid].get(metric_type)
    if model is not None:
        is_anomaly = predict_anomaly(model, np.array([[value]]))
        status = "Anomaly" if is_anomaly == -1 else "Normal"
        print(f"PID: {pid}, Metric: {metric_type}, Value: {value}, Status: {status}")
        return is_anomaly
    else:
        print(f"Model for PID {pid}, metric {metric_type} not trained yet.")
        return 1


def detect_network_anomaly(pid, interface_name, received, transmitted):
    current_time = datetime.now()
    data_store[pid]['network'].append({'time': current_time, 'received': received, 'transmitted': transmitted})
    data_size = len(data_store[pid]['network'])

    df = pd.DataFrame(data_store[pid]['network'])

    if data_size % 10 == 0:
        # Train models for received and transmitted metrics
        models[pid]['network_received'] = train_model(df[['received']])
        models[pid]['network_transmitted'] = train_model(df[['transmitted']])
        print(f"Trained network model for PID {pid}, interface {interface_name}, size: {data_size}")

    # Predict anomalies for both received and transmitted metrics
    is_anomaly_received = 1
    is_anomaly_transmitted = 1

    if models[pid].get('network_received') is not None:
        is_anomaly_received = predict_anomaly(models[pid]['network_received'], np.array([[received]]))

    if models[pid].get('network_transmitted') is not None:
        is_anomaly_transmitted = predict_anomaly(models[pid]['network_transmitted'], np.array([[transmitted]]))

    print(f"PID: {pid}, Interface: {interface_name}, Received: {received}, Transmitted: {transmitted}, "
          f"Received Status: {'Anomaly' if is_anomaly_received == -1 else 'Normal'}, "
          f"Transmitted Status: {'Anomaly' if is_anomaly_transmitted == -1 else 'Normal'}")

    return is_anomaly_received, is_anomaly_transmitted

# gRPC Server Implementation
class OutliersServer(OutliersServicer):
    def Detect(self, request, context):
        logging.info('detect request size: %d', len(request.metrics))

        response = pb2.OutliersResponse()

        for m in request.metrics:
            pid = m.pid
            value = m.value
            metric_type_enum = m.metrictype
            metric_type_name = pb2.MetricType.Name(metric_type_enum)

            if metric_type_enum in [pb2.CPU, pb2.MEMORY, pb2.DISK]:
                prediction_result = detect_anomaly(pid, metric_type_name, value)
                prediction = pb2.Prediction(
                    pid=pid,
                    type=metric_type_enum,
                    result=prediction_result
                )
                response.prediction.append(prediction)

            elif metric_type_enum == pb2.NETWORK:
                interface_name = m.interface_name
                received = m.received
                transmitted = m.transmitted

                anomaly_received, anomaly_transmitted = detect_network_anomaly(pid, interface_name, received, transmitted)

                prediction_received = pb2.Prediction(
                    pid=pid,
                    type=pb2.NETWORK,
                    result=anomaly_received
                )
                prediction_transmitted = pb2.Prediction(
                    pid=pid,
                    type=pb2.NETWORK,
                    result=anomaly_transmitted
                )

                response.prediction.append(prediction_received)
                response.prediction.append(prediction_transmitted)

            logging.info(f"PID: {pid}, Metric: {metric_type_name}, Value: {value}, Prediction: {prediction_result}")

        return response


if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
    )
    server = grpc.server(ThreadPoolExecutor())
    add_OutliersServicer_to_server(OutliersServer(), server)
    port = 9999
    server.add_insecure_port(f'[::]:{port}')
    server.start()
    logging.info('server ready on port %r', port)
    server.wait_for_termination()
