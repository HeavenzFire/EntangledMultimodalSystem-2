#!/usr/bin/env python3
"""
SYNTROPICOS LOCAL TELEMETRY MONITOR
Purpose: Scans local IP ranges to map network topology and identify potential security risks.
Dependencies: Python 3.x (Uses standard libraries only—no external dependencies required)
Extensions: Email alerts, HTML dashboard, vulnerability scanning
"""
import socket
import sys
import os
import subprocess
import smtplib
import json
import hashlib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CONFIGURATION MATRIX ---
TARGET_SUBNET = "192.168.1."
START_IP = 1
END_IP = 50
PORT_TIMEOUT = 0.3
LOG_DIR = os.path.expanduser("~/syntropic_monitor_logs")

# --- EMAIL ALERT CONFIGURATION ---
EMAIL_ALERTS_ENABLED = False
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your_email@gmail.com"
SENDER_PASSWORD = "your_app_password"
RECIPIENT_EMAIL = "alert_recipient@example.com"

# --- KNOWN DEVICES DATABASE ---
KNOWN_DEVICES_FILE = os.path.join(LOG_DIR, "known_devices.json")

# --- VULNERABILITY SCAN CONFIGURATION ---
VULNERABILITY_SCAN_ENABLED = True
VULNERABLE_PORTS = {
    21: "FTP (Unencrypted)",
    23: "Telnet (Unencrypted)",
    25: "SMTP (Potential Open Relay)",
    135: "MS-RPC (Windows Vulnerability)",
    139: "NetBIOS (File Sharing Risk)",
    445: "SMB (EternalBlue Risk)",
    3306: "MySQL (Exposed Database)",
    5900: "VNC (Remote Access Risk)"
}
ALL_SCAN_PORTS = [21, 22, 23, 25, 80, 135, 139, 443, 445, 3306, 3389, 5900, 8080]


def initialize_environment():
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
        print(f"[+] Initialized secure log matrix at: {LOG_DIR}")


def load_known_devices():
    if os.path.exists(KNOWN_DEVICES_FILE):
        with open(KNOWN_DEVICES_FILE, "r") as f:
            return json.load(f)
    return {}


def generate_device_fingerprint(ip, open_ports, mac_hint=None):
    data = f"{ip}:{sorted(open_ports)}:{mac_hint}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]


def check_device_ping(ip_address):
    param = '-n' if sys.platform.lower() == 'win32' else '-c'
    command = ['ping', param, '1', '-W', '1', ip_address]
    try:
        result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return result.returncode == 0
    except Exception:
        return False


def scan_common_ports(ip_address, extended=False):
    ports_to_test = ALL_SCAN_PORTS if extended else [22, 80, 443, 3389]
    open_ports = []
    for port in ports_to_test:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(PORT_TIMEOUT)
            result = s.connect_ex((ip_address, port))
            if result == 0:
                open_ports.append(port)
    return open_ports


def identify_vulnerabilities(open_ports):
    vulnerabilities = []
    for port in open_ports:
        if port in VULNERABLE_PORTS:
            vulnerabilities.append({
                "port": port,
                "service": VULNERABLE_PORTS[port],
                "severity": "HIGH" if port in [445, 139, 23, 21] else "MEDIUM"
            })
    return vulnerabilities


def send_email_alert(subject, body, detected_devices=None):
    if not EMAIL_ALERTS_ENABLED:
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"[SECURITY ALERT] {subject}"
        full_body = body
        if detected_devices:
            full_body += "\n\nDetected Devices:\n"
            for device in detected_devices:
                full_body += f"  - IP: {device['ip']}, Ports: {device['ports']}\n"
        msg.attach(MIMEText(full_body, 'plain'))
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[!] Email alert sent to {RECIPIENT_EMAIL}")
        return True
    except Exception as e:
        print(f"[!] Failed to send email alert: {e}")
        return False


def generate_html_dashboard(scan_results, output_path=None):
    if output_path is None:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_path = os.path.join(LOG_DIR, f"dashboard_{timestamp}.html")

    vuln_ports_list = list(VULNERABLE_PORTS.keys())

    html_header = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syntropicos Network Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #eee; min-height: 100vh; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 30px; color: #00d9ff; text-shadow: 0 0 20px rgba(0,217,255,0.5); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 25px; text-align: center; border: 1px solid rgba(255,255,255,0.2); }
        .stat-value { font-size: 3em; font-weight: bold; color: #00d9ff; }
        .stat-label { color: #aaa; margin-top: 10px; font-size: 0.9em; }
        .devices-section { background: rgba(255,255,255,0.05); border-radius: 15px; padding: 25px; margin-bottom: 30px; }
        .device-card { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #00d9ff; }
        .device-card.unauthorized { border-left-color: #ff4757; }
        .device-card.vulnerable { border-left-color: #ffa502; }
        .device-ip { font-size: 1.3em; color: #00d9ff; margin-bottom: 10px; }
        .device-ports { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .port-badge { background: rgba(0,217,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 0.85em; }
        .port-badge.vulnerable { background: rgba(255,165,2,0.3); }
        .vulnerability-alert { background: rgba(255,71,87,0.2); border: 1px solid #ff4757; border-radius: 10px; padding: 15px; margin-top: 10px; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; }
        .legend { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
        .legend-item { display: flex; align-items: center; gap: 8px; }
        .legend-color { width: 20px; height: 20px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Network Dashboard</h1>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value" id="stat-devices">0</div><div class="stat-label">Active Devices</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-unauthorized">0</div><div class="stat-label">Unauthorized Devices</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-vulns">0</div><div class="stat-label">Vulnerabilities Detected</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-range">N/A</div><div class="stat-label">IP Range Scanned</div></div>
        </div>
        <div class="legend">
            <div class="legend-item"><div class="legend-color" style="background: #00d9ff;"></div> Known Device</div>
            <div class="legend-item"><div class="legend-color" style="background: #ff4757;"></div> Unauthorized</div>
            <div class="legend-item"><div class="legend-color" style="background: #ffa502;"></div> Vulnerable</div>
        </div>
        <div class="devices-section">
            <h2 style="margin-bottom: 20px; color: #00d9ff;">Detected Devices</h2>
            <div id="devices-container"></div>
        </div>
        <div class="timestamp">Scan completed: <span id="scan-timestamp">N/A</span></div>
    </div>
    <script>
        const scanData = SCAN_DATA_PLACEHOLDER;
        const vulnPorts = VULN_PORTS_PLACEHOLDER;
        document.getElementById('stat-devices').textContent = scanData.devices.length;
        document.getElementById('stat-unauthorized').textContent = scanData.unauthorized.length;
        document.getElementById('stat-vulns').textContent = scanData.vulnerability_count;
        document.getElementById('stat-range').textContent = scanData.scan_range;
        document.getElementById('scan-timestamp').textContent = scanData.timestamp;
        const container = document.getElementById('devices-container');
        const knownDevices = scanData.known_devices || {};
        scanData.devices.forEach(device => {
            const ip = device.ip;
            const ports = device.ports || [];
            const vulns = device.vulnerabilities || [];
            const isUnauthorized = !(ip in knownDevices);
            const isVulnerable = vulns.length > 0;
            let cardClass = 'device-card';
            let statusBadge = 'Known';
            if (isUnauthorized) { cardClass += ' unauthorized'; statusBadge = 'UNAUTHORIZED'; }
            else if (isVulnerable) { cardClass += ' vulnerable'; statusBadge = 'VULNERABLE'; }
            let portsHtml = ports.map(p => {
                const isVulnPort = vulnPorts.includes(p);
                return '<span class="port-badge' + (isVulnPort ? ' vulnerable' : '') + '">Port ' + p + '</span>';
            }).join('');
            let vulnHtml = '';
            if (vulns.length > 0) {
                vulnHtml = '<div class="vulnerability-alert"><strong>Security Risks:</strong><br>' +
                    vulns.map(v => 'Port ' + v.port + ': ' + v.service + ' (Severity: ' + v.severity + ')<br>').join('') + '</div>';
            }
            const card = document.createElement('div');
            card.className = cardClass;
            card.innerHTML = '<div class="device-ip">' + ip + ' <span style="font-size: 0.7em; color: #888;">' + statusBadge + '</span></div><div>Open Ports:</div><div class="device-ports">' + portsHtml + '</div>' + vulnHtml;
            container.appendChild(card);
        });
    </script>
</body>
</html>"""

    html_content = html_header.replace("SCAN_DATA_PLACEHOLDER", json.dumps(scan_results))
    html_content = html_content.replace("VULN_PORTS_PLACEHOLDER", json.dumps(vuln_ports_list))

    with open(output_path, "w") as f:
        f.write(html_content)
    print(f"[+] HTML dashboard generated: {output_path}")
    return output_path


def execute_pipeline():
    initialize_environment()
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file_path = os.path.join(LOG_DIR, f"network_scan_{timestamp}.log")

    print(f"\n[!] Initializing Sovereign Mesh Scan across range: {TARGET_SUBNET}{START_IP}-{END_IP}")
    print(f"[!] Target Log: {log_file_path}\n" + "-"*50)

    active_nodes = 0
    scan_data = {
        "timestamp": datetime.now().isoformat(),
        "scan_range": f"{TARGET_SUBNET}{START_IP}-{END_IP}",
        "devices": [],
        "unauthorized": [],
        "vulnerability_count": 0,
        "known_devices": {}
    }

    known_devices = load_known_devices()
    scan_data["known_devices"] = known_devices
    new_devices_detected = []

    with open(log_file_path, "w") as log_file:
        log_file.write("SYNTROPICOS NETWORK SCAN REPORT\n")
        log_file.write(f"TIMESTAMP: {datetime.now().isoformat()}\n")
        log_file.write(f"TARGET SUBNET: {TARGET_SUBNET}{START_IP}-{END_IP}\n")
        log_file.write("="*50 + "\n")

        for i in range(START_IP, END_IP + 1):
            ip = f"{TARGET_SUBNET}{i}"
            if check_device_ping(ip):
                active_nodes += 1
                open_services = scan_common_ports(ip, extended=VULNERABILITY_SCAN_ENABLED)
                vulnerabilities = []
                if VULNERABILITY_SCAN_ENABLED:
                    vulnerabilities = identify_vulnerabilities(open_services)
                    scan_data["vulnerability_count"] += len(vulnerabilities)

                fingerprint = generate_device_fingerprint(ip, open_services)
                is_known = ip in known_devices

                if not is_known:
                    scan_data["unauthorized"].append({"ip": ip, "ports": open_services})
                    new_devices_detected.append({"ip": ip, "ports": open_services})
                    status_message = f"UNAUTHORIZED NODE: {ip} | Ports: {open_services if open_services else 'None'}"
                else:
                    status_message = f"KNOWN NODE: {ip} | Ports: {open_services if open_services else 'None'}"

                if vulnerabilities:
                    status_message += f" | VULNERABILITIES: {len(vulnerabilities)}"

                print(f"[+] {status_message}")
                log_file.write(status_message + "\n")
                scan_data["devices"].append({
                    "ip": ip,
                    "ports": open_services,
                    "vulnerabilities": vulnerabilities,
                    "fingerprint": fingerprint
                })

        log_file.write("="*50 + "\n")
        summary = f"Scan complete. Found {active_nodes} active devices out of {END_IP - START_IP + 1} scanned."
        log_file.write(summary + "\n")

        if scan_data["unauthorized"]:
            alert_msg = f"ALERT: {len(scan_data['unauthorized'])} unauthorized device(s) detected!"
            log_file.write(alert_msg + "\n")
            print(f"\n[!] {alert_msg}")

        if scan_data["vulnerability_count"] > 0:
            vuln_msg = f"WARNING: {scan_data['vulnerability_count']} vulnerability(ies) found!"
            log_file.write(vuln_msg + "\n")
            print(f"[!] {vuln_msg}")

        print("-"*50 + f"\n[=] {summary}")

    if new_devices_detected and EMAIL_ALERTS_ENABLED:
        send_email_alert(
            subject=f"Unauthorized Device(s) Detected on {TARGET_SUBNET[:-1]}",
            body=f"Scan at {scan_data['timestamp']} detected {len(new_devices_detected)} unknown device(s).",
            detected_devices=new_devices_detected
        )

    dashboard_path = generate_html_dashboard(scan_data)
    json_path = os.path.join(LOG_DIR, f"scan_data_{timestamp}.json")
    with open(json_path, "w") as f:
        json.dump(scan_data, f, indent=2)
    print(f"[+] Scan data saved: {json_path}")
    return scan_data


if __name__ == "__main__":
    try:
        execute_pipeline()
    except KeyboardInterrupt:
        print("\n[-] Scan interrupted by user command.")
        sys.exit(0)
