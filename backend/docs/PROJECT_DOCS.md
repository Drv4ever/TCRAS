# TCRAS Project Documentation

## 1. System Requirement Specification (SRS)

### 1.1 Introduction
The Transfer-Chain Risk Amplification System (TCRAS) is a security monitoring tool designed to detect malicious file propagation within a LAN.

### 1.2 Functional Requirements
- **FR1**: The system shall monitor file creation, modification, and movement on client devices.
- **FR2**: The system shall visualization the flow of files between devices as a directed graph.
- **FR3**: The system shall assign a risk score (0-100) to each transfer based on anomaly detection.
- **FR4**: The system shall alert administrators in real-time for scores > 70.

### 1.3 Non-Functional Requirements
- **NFR1**: The agent must consume < 50MB RAM.
- **NFR2**: Risk analysis must complete within 200ms.
- **NFR3**: The dashboard must update every 2 seconds.

---

## 2. Software Design Document (SDD)

### 2.1 Architecture
The system follows a Client-Server architecture.
- **Clients**: Python Watchdog Agents.
- **Server**: FastAPI REST API + SQLite + NetworkX.
- **Frontend**: HTML5 + Vanilla JS + Vis.js.

### 2.2 Data Model
- **EventLog Table**: `id`, `filename`, `hash`, `source`, `dest`, `timestamp`.
- **Graph Model**: Directed Graph where Nodes=IPs, Edges=Transfers.

### 2.3 Algorithms
- **Graph**: Longest Path algorithm (DAG) to detect chains. Cycle detection for worm behavior.
- **AI**: Isolation Forest (Unsupervised) on feature vector `[size, chain_len, degree]`.

---

## 3. Test Plan

### 3.1 Unit Testing
- **GraphEngine**: Test `add_transfer` and `is_cyclic` with mock data.
- **RiskEngine**: Test scoring logic with extreme values (very large files, long chains).

### 3.2 Integration Testing
- **Agent -> Server**: meaningful connection, JSON payload validation.
- **Server -> Database**: verify persistence of events.

### 3.3 System Testing (Scenario)
- **Scenario**: "Worm Attack Simulation"
  1. Transfer File A -> Laptop A. (Score: Low)
  2. Transfer File A -> Laptop B. (Score: Low)
  3. Transfer File A -> Laptop A (Loop). (Score: High)
  - **Expected Result**: Dashboard flashes Red Alert.

---

## 4. Final Report Structure (Suggested)

1.  **Abstract**: Summary of the project.
2.  **Introduction**: Problem statement (LAN security gaps).
3.  **Literature Review**: Existing file monitoring tools (DLP, SIEM).
4.  **Methodology**:
    - System Architecture.
    - Graph Theory Application.
    - Anomaly Detection Algorithm.
5.  **Implementation**: Snippets of Python code (Agent/Server).
6.  **Results & Analysis**: Screenshots of Dashboard, Risk Scoring accuracy.
7.  **Conclusion & Future Work**: Enhancements (Blocking transfers, Active Directory integration).
8.  **References**.
