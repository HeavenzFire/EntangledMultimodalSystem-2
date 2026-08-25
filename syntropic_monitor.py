#!/usr/bin/env python3
"""
SYNTROPICOS LOCAL TELEMETRY MONITOR
Purpose: Scans local IP ranges to map network topology and identify potential security risks.
Dependencies: Python 3.x (Uses standard libraries only—no external dependencies required)
"""
import socket
import sys
import os
import subprocess
from datetime import datetime

# --- CONFIGURATION MATRIX ---
TARGET_SUBNET = "192.168.1."  # Change to match your local router gateway (e.g., 10.0.0.)
START_IP = 1
END_IP = 50                  # Scans IPs .1 through .50 for rapid diagnostic mapping
PORT_TIMEOUT = 0.3           # Speed of connection handshake in seconds
LOG_DIR = os.path.expanduser("~/syntropic_monitor_logs")


def initialize_environment():
    """Ensures the workspace log directories exist."""
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
        print(f"[+] Initialized secure log matrix at: {LOG_DIR}")


def check_device_ping(ip_address):
    """Executes a standard ICMP ping to check if a node is alive."""
    # -c 1 sends 1 packet, -W 1 waits 1 second for a response
    param = '-n' if sys.platform.lower() == 'win32' else '-c'
    command = ['ping', param, '1', '-W', '1', ip_address]
    
    try:
        # Divert output to devnull to keep the interface clean
        result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return result.returncode == 0
    except Exception:
        return False


def scan_common_ports(ip_address):
    """Probes vital network ports to determine active services."""
    # 22: SSH, 80: HTTP, 443: HTTPS, 3389: Remote Desktop
    ports_to_test = [22, 80, 443, 3389]
    open_ports = []
    
    for port in ports_to_test:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(PORT_TIMEOUT)
            result = s.connect_ex((ip_address, port))
            if result == 0:
                open_ports.append(port)
    return open_ports


def execute_pipeline():
    """Runs the full diagnostic scan and records the data."""
    initialize_environment()
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file_path = os.path.join(LOG_DIR, f"network_scan_{timestamp}.log")
    
    print(f"\n[!] Initializing Sovereign Mesh Scan across range: {TARGET_SUBNET}{START_IP}-{END_IP}")
    print(f"[!] Target Log: {log_file_path}\n" + "-"*50)
    
    active_nodes = 0
    
    with open(log_file_path, "w") as log_file:
        log_file.write("SYNTROPICOS NETWORK SCAN REPORT\n")
        log_file.write(f"TIMESTAMP: {datetime.now().isoformat()}\n")
        log_file.write(f"TARGET SUBNET: {TARGET_SUBNET}{START_IP}-{END_IP}\n")
        log_file.write("="*50 + "\n")
        
        for i in range(START_IP, END_IP + 1):
            ip = f"{TARGET_SUBNET}{i}"
            
            # Phase 1: Ping verification
            if check_device_ping(ip):
                active_nodes += 1
                # Phase 2: Port analysis
                open_services = scan_common_ports(ip)
                
                status_message = f"NODE DETECTED: {ip} | Active Ports: {open_services if open_services else 'None Detected'}"
                print(f"[+] {status_message}")
                log_file.write(status_message + "\n")
                
        log_file.write("="*50 + "\n")
        summary = f"Scan complete. Found {active_nodes} active devices out of {END_IP - START_IP + 1} scanned."
        log_file.write(summary + "\n")
        print("-"*50 + f"\n[=] {summary}")


if __name__ == "__main__":
    try:
        execute_pipeline()
    except KeyboardInterrupt:
        print("\n[-] Scan interrupted by user command.")
        sys.exit(0)
