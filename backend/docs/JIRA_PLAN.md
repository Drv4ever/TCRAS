# TCRAS Jira Project Plan

## Epics
1.  **Core Infrastructure** (Setup, DB, API)
2.  **Agent Development** (File Monitoring)
3.  **Intelligence Module** (Graph & AI)
4.  **Frontend & Visualization** (Dashboard)
5.  **Validation & Testing**

## Sprint 1: Foundation & Monitoring (2 Weeks)
**Goal**: Get data flowing from Agent to Server.

| Issue Type | Summary | Story Points | Assignee |
| :--- | :--- | :--- | :--- |
| Story | As a Dev, I want the basic folder structure and Git repo. | 1 | Architect |
| Story | As a Dev, I want a database schema for file events. | 2 | Backend Dev |
| Task | Implement FastAPI Basic Server and Health Check. | 2 | Backend Dev |
| Story | As a User, I want the Agent to detect file creation. | 5 | Agent Dev |
| Task | Implement Watchdog Event Handler. | 3 | Agent Dev |
| Task | Implement HTTP POST sender in Agent. | 3 | Agent Dev |
| Story | As an Admin, I want to see raw JSON logs on the server. | 3 | Backend Dev |

## Sprint 2: Intelligence & Visualization (2 Weeks)
**Goal**: Analyze data and show it on the dashboard.

| Issue Type | Summary | Story Points | Assignee |
| :--- | :--- | :--- | :--- |
| Story | As an Admin, I want to see a visual graph of transfers. | 8 | Frotnend Dev |
| Task | Implement NetworkX Graph Engine backend. | 5 | AI Dev |
| Task | Implement Vis.js Frontend Graph. | 5 | Frontend Dev |
| Story | As an Admin, I want to be alerted on high risk transfers. | 8 | AI Dev |
| Task | Train/Setup Isolation Forest Model. | 5 | AI Dev |
| Task | Implement Risk Scoring Logic API. | 3 | AI Dev |
| Task | Add Animations and Alerts to Dashboard. | 3 | Frontend Dev |

## User Stories (Backlog)
- As a User, I want to drag-and-drop files to transfer them.
- As an Admin, I want to export risk reports as PDF.
- As a User, I want to authenticate before sending files.
