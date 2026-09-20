#!/usr/bin/env python3
"""
SYNTROPICOS LOCAL TELEMETRY MONITOR - PRODUCTION EDITION
Modular architecture with Vulnerability Scanning, Email Alerts, and HTML Dashboard.
Dependencies: Python 3.x (Standard library only: socket, subprocess, sqlite3, json, smtplib, email)
"""

import socket
import sys
import os
import subprocess
import json
import sqlite3
import hashlib
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional

# ==================== CONFIGURATION MATRIX ====================
TARGET_SUBNET = "192.168.1."
START_IP = 1
END_IP = 50
PORT_TIMEOUT = 0.3
LOG_DIR = os.path.expanduser("~/syntropic_monitor_logs")
DB_PATH = os.path.join(LOG_DIR, "telemetry.db")

# Email Configuration (Update for alerts)
EMAIL_ALERTS_ENABLED = False
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your_email@gmail.com"
SENDER_PASSWORD = "your_app_password"  # Use app-specific password
RECIPIENT_EMAIL = "alert_recipient@example.com"

# Extended Port Map with Vulnerability Data
PORT_VULN_DB = {
    21: {"service": "FTP", "risk": "HIGH", "cve": "CVE-2021-3180", "desc": "Unencrypted file transfer"},
    22: {"service": "SSH", "risk": "MEDIUM", "cve": "N/A", "desc": "Secure shell (check for weak keys)"},
    23: {"service": "Telnet", "risk": "CRITICAL", "cve": "CVE-2020-10188", "desc": "Unencrypted remote access"},
    80: {"service": "HTTP", "risk": "MEDIUM", "cve": "N/A", "desc": "Unencrypted web traffic"},
    443: {"service": "HTTPS", "risk": "LOW", "cve": "N/A", "desc": "Encrypted web traffic"},
    445: {"service": "SMB", "risk": "CRITICAL", "cve": "CVE-2017-0144", "desc": "EternalBlue vulnerability vector"},
    3306: {"service": "MySQL", "risk": "HIGH", "cve": "CVE-2021-2307", "desc": "Database exposure"},
    3389: {"service": "RDP", "risk": "HIGH", "cve": "CVE-2019-0708", "desc": "Remote desktop exposure"},
    5432: {"service": "PostgreSQL", "risk": "HIGH", "cve": "CVE-2021-23214", "desc": "Database exposure"},
    5900: {"service": "VNC", "risk": "CRITICAL", "cve": "CVE-2020-21222", "desc": "Unencrypted remote desktop"},
    6379: {"service": "Redis", "risk": "HIGH", "cve": "CVE-2022-0543", "desc": "In-memory database exposure"},
    8080: {"service": "HTTP-Alt", "risk": "MEDIUM", "cve": "N/A", "desc": "Alternative web server"},
    27017: {"service": "MongoDB", "risk": "CRITICAL", "cve": "CVE-2021-20328", "desc": "NoSQL database exposure"}
}

# ==================== DATA MODELS ====================
class Device:
    def __init__(self, ip: str, open_ports: List[int], vulnerabilities: List[Dict] = None):
        self.ip = ip
        self.open_ports = open_ports
        self.vulnerabilities = vulnerabilities or []
        self.fingerprint = self._generate_fingerprint()
        self.first_seen = datetime.now().isoformat()
        self.last_seen = self.first_seen
        self.is_known = False

    def _generate_fingerprint(self) -> str:
        """Generate SHA256 fingerprint based on IP and open ports."""
        data = f"{self.ip}:{sorted(self.open_ports)}"
        return hashlib.sha256(data.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ip": self.ip,
            "open_ports": self.open_ports,
            "vulnerabilities": self.vulnerabilities,
            "fingerprint": self.fingerprint,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "is_known": self.is_known,
            "max_severity": self._get_max_severity()
        }

    def _get_max_severity(self) -> str:
        if not self.vulnerabilities:
            return "NONE"
        severity_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"]
        vuln_severities = [v["risk"] for v in self.vulnerabilities]
        for sev in severity_order:
            if sev in vuln_severities:
                return sev
        return "NONE"

# ==================== CORE SCANNER ====================
class NetworkScanner:
    def __init__(self, subnet: str, start: int, end: int, timeout: float):
        self.subnet = subnet
        self.start = start
        self.end = end
        self.timeout = timeout

    def ping_host(self, ip: str) -> bool:
        param = '-n' if sys.platform.lower() == 'win32' else '-c'
        command = ['ping', param, '1', '-W', '1', ip]
        try:
            result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return result.returncode == 0
        except Exception:
            return False

    def scan_ports(self, ip: str) -> List[int]:
        open_ports = []
        for port in PORT_VULN_DB.keys():
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(self.timeout)
                if s.connect_ex((ip, port)) == 0:
                    open_ports.append(port)
        return open_ports

    def scan_network(self) -> List[Device]:
        devices = []
        print(f"\n[!] Scanning {self.subnet}{self.start}-{self.subnet}{self.end}...")
        for i in range(self.start, self.end + 1):
            ip = f"{self.subnet}{i}"
            if self.ping_host(ip):
                open_ports = self.scan_ports(ip)
                device = Device(ip, open_ports)
                devices.append(device)
                print(f"[+] Found: {ip} | Ports: {open_ports}")
        return devices

# ==================== VULNERABILITY ENGINE ====================
class VulnAnalyzer:
    def analyze(self, devices: List[Device]) -> List[Device]:
        for device in devices:
            vulns = []
            for port in device.open_ports:
                if port in PORT_VULN_DB:
                    vuln_info = PORT_VULN_DB[port].copy()
                    vuln_info["port"] = port
                    vulns.append(vuln_info)
            device.vulnerabilities = vulns
        return devices

    def get_summary(self, devices: List[Device]) -> Dict[str, int]:
        summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "NONE": 0}
        for device in devices:
            max_sev = device._get_max_severity()
            if max_sev in summary:
                summary[max_sev] += 1
        return summary

# ==================== PERSISTENCE LAYER ====================
class DataStore:
    def __init__(self, db_path: str, log_dir: str):
        self.db_path = db_path
        self.log_dir = log_dir
        self._init_db()

    def _init_db(self):
        os.makedirs(self.log_dir, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                device_ip TEXT,
                fingerprint TEXT,
                open_ports TEXT,
                vulnerabilities TEXT,
                max_severity TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS known_devices (
                fingerprint TEXT PRIMARY KEY,
                first_seen TEXT,
                last_seen TEXT,
                ip TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def save_scan(self, devices: List[Device], timestamp: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        for device in devices:
            # Check if known
            cursor.execute("SELECT first_seen FROM known_devices WHERE fingerprint=?", (device.fingerprint,))
            row = cursor.fetchone()
            if row:
                device.is_known = True
                device.first_seen = row[0]
                cursor.execute("UPDATE known_devices SET last_seen=?, ip=? WHERE fingerprint=?",
                             (timestamp, device.ip, device.fingerprint))
            else:
                cursor.execute("INSERT INTO known_devices VALUES (?, ?, ?, ?)",
                             (device.fingerprint, timestamp, timestamp, device.ip))

            cursor.execute('''
                INSERT INTO scans (timestamp, device_ip, fingerprint, open_ports, vulnerabilities, max_severity)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                timestamp,
                device.ip,
                device.fingerprint,
                json.dumps(device.open_ports),
                json.dumps(device.vulnerabilities),
                device._get_max_severity()
            ))
        conn.commit()
        conn.close()

        # Save JSON report
        json_path = os.path.join(self.log_dir, f"scan_{timestamp.replace(':', '-')}.json")
        with open(json_path, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "devices": [d.to_dict() for d in devices],
                "vuln_summary": VulnAnalyzer().get_summary(devices)
            }, f, indent=2)
        return json_path

    def get_known_fingerprints(self) -> set:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT fingerprint FROM known_devices")
        fingerprints = {row[0] for row in cursor.fetchall()}
        conn.close()
        return fingerprints

    def get_historical_data(self, limit: int = 10) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT timestamp, COUNT(*), 
                   SUM(CASE WHEN max_severity='CRITICAL' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN max_severity='HIGH' THEN 1 ELSE 0 END)
            FROM scans GROUP BY timestamp ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
        results = []
        for row in cursor.fetchall():
            results.append({
                "timestamp": row[0],
                "total_devices": row[1],
                "critical_count": row[2] or 0,
                "high_count": row[3] or 0
            })
        conn.close()
        return results

# ==================== ALERTING SERVICE ====================
class EmailNotifier:
    def __init__(self, enabled: bool, smtp_server: str, smtp_port: int,
                 sender: str, password: str, recipient: str):
        self.enabled = enabled
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender = sender
        self.password = password
        self.recipient = recipient

    def send_alert(self, unknown_devices: List[Device], timestamp: str):
        if not self.enabled or not unknown_devices:
            return

        subject = f"🚨 SECURITY ALERT: {len(unknown_devices)} Unknown Device(s) Detected"
        body = f"""
SECURITY ALERT - SYNTROPICOS MONITOR
Timestamp: {timestamp}

{len(unknown_devices)} unknown device(s) detected on your network:

"""
        for device in unknown_devices:
            body += f"- IP: {device.ip}\n"
            body += f"  Open Ports: {device.open_ports}\n"
            if device.vulnerabilities:
                body += f"  Vulnerabilities: {[v['service'] for v in device.vulnerabilities]}\n"
                body += f"  Max Severity: {device._get_max_severity()}\n"
            body += "\n"

        body += """
ACTION REQUIRED:
1. Verify if these devices are authorized
2. If unauthorized, isolate immediately
3. Update your known devices list

-- SyntropicOS Monitor
"""

        msg = MIMEMultipart()
        msg['From'] = self.sender
        msg['To'] = self.recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender, self.password)
            server.send_message(msg)
            server.quit()
            print(f"[!] Email alert sent to {self.recipient}")
        except Exception as e:
            print(f"[-] Failed to send email: {e}")

# ==================== DASHBOARD GENERATOR ====================
class DashboardGenerator:
    def generate(self, devices: List[Device], historical: List[Dict], output_path: str):
        vuln_summary = VulnAnalyzer().get_summary(devices)
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SyntropicOS Network Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f1419; color: #e7e9ea; padding: 20px; }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        h1 {{ color: #1da1f2; margin-bottom: 10px; }}
        .timestamp {{ color: #8b98a5; margin-bottom: 30px; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .stat-card {{ background: #192734; padding: 20px; border-radius: 12px; text-align: center; }}
        .stat-value {{ font-size: 2.5em; font-weight: bold; }}
        .stat-label {{ color: #8b98a5; margin-top: 5px; }}
        .critical {{ color: #f4212e; }}
        .high {{ color: #ff7a00; }}
        .medium {{ color: #ffc107; }}
        .low {{ color: #1da1f2; }}
        .none {{ color: #00ba7c; }}
        .section {{ background: #192734; padding: 25px; border-radius: 12px; margin-bottom: 25px; }}
        .section h2 {{ color: #1da1f2; margin-bottom: 20px; }}
        .device-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }}
        .device-card {{ background: #1f2c39; padding: 15px; border-radius: 8px; border-left: 4px solid #00ba7c; }}
        .device-card.critical {{ border-left-color: #f4212e; }}
        .device-card.high {{ border-left-color: #ff7a00; }}
        .device-card.medium {{ border-left-color: #ffc107; }}
        .device-ip {{ font-weight: bold; font-size: 1.1em; margin-bottom: 8px; }}
        .device-ports {{ color: #8b98a5; font-size: 0.9em; }}
        .device-vulns {{ margin-top: 10px; }}
        .vuln-tag {{ display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; margin: 2px; }}
        .vuln-critical {{ background: rgba(244, 33, 46, 0.2); color: #f4212e; }}
        .vuln-high {{ background: rgba(255, 122, 0, 0.2); color: #ff7a00; }}
        .vuln-medium {{ background: rgba(255, 193, 7, 0.2); color: #ffc107; }}
        .vuln-low {{ background: rgba(29, 161, 242, 0.2); color: #1da1f2; }}
        .chart-container {{ height: 300px; }}
        .unknown-badge {{ background: #f4212e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛰️ SyntropicOS Network Dashboard</h1>
        <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{len(devices)}</div>
                <div class="stat-label">Total Devices</div>
            </div>
            <div class="stat-card">
                <div class="stat-value critical">{vuln_summary['CRITICAL']}</div>
                <div class="stat-label">Critical Risk</div>
            </div>
            <div class="stat-card">
                <div class="stat-value high">{vuln_summary['HIGH']}</div>
                <div class="stat-label">High Risk</div>
            </div>
            <div class="stat-card">
                <div class="stat-value medium">{vuln_summary['MEDIUM']}</div>
                <div class="stat-label">Medium Risk</div>
            </div>
            <div class="stat-card">
                <div class="stat-value low">{vuln_summary['LOW']}</div>
                <div class="stat-label">Low Risk</div>
            </div>
            <div class="stat-card">
                <div class="stat-value none">{vuln_summary['NONE']}</div>
                <div class="stat-label">Secure</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Historical Trend (Last 10 Scans)</h2>
            <div class="chart-container">
                <canvas id="trendChart"></canvas>
            </div>
        </div>

        <div class="section">
            <h2>🖥️ Device Inventory</h2>
            <div class="device-grid">
"""
        
        for device in devices:
            unknown_badge = '<span class="unknown-badge">UNKNOWN</span>' if not device.is_known else ''
            html_content += f"""
                <div class="device-card {device._get_max_severity().lower()}">
                    <div class="device-ip">{device.ip} {unknown_badge}</div>
                    <div class="device-ports">Ports: {device.open_ports if device.open_ports else 'None'}</div>
"""
            if device.vulnerabilities:
                html_content += '<div class="device-vulns">'
                for vuln in device.vulnerabilities:
                    html_content += f'<span class="vuln-tag vuln-{vuln["risk"].lower()}">{vuln["service"]} ({vuln["risk"]})</span>'
                html_content += '</div>'
            html_content += "</div>"

        html_content += """
            </div>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('trendChart').getContext('2d');
        const historicalData = """ + json.dumps(historical) + """;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.map(d => d.timestamp.slice(11, 19)),
                datasets: [{
                    label: 'Total Devices',
                    data: historicalData.map(d => d.total_devices),
                    borderColor: '#1da1f2',
                    tension: 0.4
                }, {
                    label: 'Critical Risks',
                    data: historicalData.map(d => d.critical_count),
                    borderColor: '#f4212e',
                    tension: 0.4
                }, {
                    label: 'High Risks',
                    data: historicalData.map(d => d.high_count),
                    borderColor: '#ff7a00',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#e7e9ea' } }
                },
                scales: {
                    y: { ticks: { color: '#8b98a5' }, grid: { color: '#192734' } },
                    x: { ticks: { color: '#8b98a5' }, grid: { color: '#192734' } }
                }
            }
        });
    </script>
</body>
</html>
"""
        
        dashboard_path = os.path.join(output_path, f"dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
        with open(dashboard_path, 'w') as f:
            f.write(html_content)
        
        return dashboard_path

# ==================== MAIN PIPELINE ====================
def execute_pipeline():
    timestamp = datetime.now().isoformat()
    
    # Initialize components
    scanner = NetworkScanner(TARGET_SUBNET, START_IP, END_IP, PORT_TIMEOUT)
    analyzer = VulnAnalyzer()
    datastore = DataStore(DB_PATH, LOG_DIR)
    notifier = EmailNotifier(
        EMAIL_ALERTS_ENABLED, SMTP_SERVER, SMTP_PORT,
        SENDER_EMAIL, SENDER_PASSWORD, RECIPIENT_EMAIL
    )
    dashboard_gen = DashboardGenerator()

    # Execute scan
    devices = scanner.scan_network()
    
    if not devices:
        print("[-] No devices found. Check network configuration.")
        return

    # Analyze vulnerabilities
    devices = analyzer.analyze(devices)
    
    # Load known devices
    known_fps = datastore.get_known_fingerprints()
    for device in devices:
        if device.fingerprint in known_fps:
            device.is_known = True

    # Identify unknown devices
    unknown_devices = [d for d in devices if not d.is_known]
    
    # Save to persistence layer
    json_path = datastore.save_scan(devices, timestamp)
    print(f"[+] Scan saved: {json_path}")

    # Send alerts if needed
    if unknown_devices:
        print(f"[!] WARNING: {len(unknown_devices)} unknown device(s) detected!")
        notifier.send_alert(unknown_devices, timestamp)

    # Generate dashboard
    historical = datastore.get_historical_data()
    dashboard_path = dashboard_gen.generate(devices, historical, LOG_DIR)
    print(f"[+] Dashboard generated: {dashboard_path}")

    # Print summary
    summary = analyzer.get_summary(devices)
    print("\n" + "="*50)
    print("VULNERABILITY SUMMARY:")
    for severity, count in summary.items():
        if count > 0:
            print(f"  {severity}: {count} device(s)")
    print("="*50)

if __name__ == "__main__":
    try:
        execute_pipeline()
    except KeyboardInterrupt:
        print("\n[-] Scan interrupted by user.")
        sys.exit(0)
