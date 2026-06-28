# INNUTRIRE — System Overview

> End-to-end flow from a clinician requesting a prediction to the result appearing on the bedside screen, and how the Moniteer dashboard observes the entire system.

---

## Full System Architecture

```mermaid
flowchart TD
    subgraph CLINICIAN[Clinician — ICU Bedside]
        TAB[Tablet or PC running desktop app]
    end

    subgraph APP[Desktop App — frontend_innutrire]
        LIST[Patient List]
        DASH[Patient Dashboard]
        WIZARD[REE Calculation Wizard]
        RESULT[Result Display]
    end

    subgraph HOSPITAL_SERVER[Hospital Server — deployed by IaC]
        FW[Firewall]
        subgraph CONTAINERS[Docker Compose]
            API[Django REST API]
            DB[PostgreSQL]
        end
    end

    subgraph MONITEER[Moniteer — Centralised Monitoring]
        MDASH[Web Dashboard]
        MBE[Monitoring Backend]
        MDB[Monitoring Database]
    end

    subgraph ML[ML Research — Offline]
        MODEL[Trained SVR Model]
    end

    TAB --> LIST --> DASH --> WIZARD
    WIZARD -->|Submit measurements| FW
    FW --> API
    API --> DB
    DB --> API
    API --> FW
    FW --> RESULT
    RESULT --> TAB

    ML -->|Deploy model artifact| API

    ADMIN[Administrator] --> MDASH
    MDASH --> MBE
    MBE --> MDB
    MBE -->|Live health probes| API
    MBE -->|Nightly data snapshots| API
```

---

## Prediction Request — Step by Step

```mermaid
sequenceDiagram
    actor C as Clinician
    participant App as Desktop App
    participant Server as Hospital Server
    participant API as Django API
    participant DB as Database

    C->>App: Select patient
    C->>App: Complete 5-step measurement form
    C->>App: Click Calculate

    App->>Server: Send clinical measurements
    Server->>API: Forward to API
    API->>API: Feature engineering
    API->>API: SVR model predicts REE
    API->>API: Apply injury factor
    API->>DB: Save prediction
    DB-->>API: Prediction ID
    API-->>Server: REE and recommendation
    Server-->>App: Response

    App->>Server: Save gold standard IC measurements
    Server->>API: Record against prediction
    API->>DB: Save gold standard
    DB-->>API: Confirmed
    API-->>App: Done

    App->>C: Display REE result and energy recommendation
```

---

## Monitoring Flow — Moniteer Observing INNUTRIRE

```mermaid
sequenceDiagram
    actor Admin as Administrator
    participant Dash as Moniteer Dashboard
    participant MBE as Moniteer Backend
    participant Agent as INNUTRIRE Agent Endpoints

    Admin->>Dash: Open hospital details
    Dash->>MBE: Request live server health
    MBE->>Agent: Ping — is server reachable?
    Agent-->>MBE: Status
    MBE->>Agent: Fetch CPU, memory, disk, uptime
    Agent-->>MBE: Health metrics
    MBE-->>Dash: Server health data
    Dash-->>Admin: Display health cards

    note over MBE,Agent: Nightly at midnight
    MBE->>Agent: Fetch patients, predictions, gold standard
    Agent-->>MBE: Full data snapshot
    MBE->>MBE: Store snapshot in monitoring database
```

---

## Repository Roles

```mermaid
flowchart LR
    subgraph ML[Regression Models]
        R1[Research and train models\noffline data science work]
    end

    subgraph IAC[Infrastructure IaC]
        R2[Provision hospital server\nDeploy containers]
    end

    subgraph BACKEND[Django Backend]
        R3[Serve REST API\nRun ML inference\nExpose agent endpoints]
    end

    subgraph FRONTEND[Desktop App]
        R4[Clinician interface\nICU bedside tablet]
    end

    subgraph MONITEER[Moniteer]
        R5[Central monitoring dashboard\nHealth and snapshot visibility]
    end

    ML -->|Export trained model| BACKEND
    IAC -->|Provision and deploy| BACKEND
    FRONTEND -->|HTTP API calls| BACKEND
    MONITEER -->|Reads agent endpoints| BACKEND
```

---

## Data Flow — Vitals to Prediction

```mermaid
flowchart TD
    INPUT[Clinician enters\nbody weight, height, age, gender\nclinical severity scores\nvitals with multiple readings\ntrauma and burns details]

    INPUT --> COLLECT[App collects all measurements]
    COLLECT --> SEND[Send to backend API]
    SEND --> FE[Feature engineering\nAverage repeated readings\nClassify and encode fields]
    FE --> PREDICT[SVR model predicts REE]
    PREDICT --> ADJUST[Adjust for injury severity]
    ADJUST --> STORE[Save to database]
    STORE --> RETURN[Return REE value and energy recommendation]
    RETURN --> DISPLAY[Display result to clinician]
```

---

## Infrastructure Topology

```mermaid
flowchart TB
    subgraph HOSPITAL_LAN[Hospital LAN]
        T1[ICU Tablet]
        T2[ICU Tablet]
        subgraph HOSPITAL_SERVER[Hospital Server]
            FW[Firewall]
            API[Django API]
            DB[PostgreSQL]
        end
    end

    subgraph MONITEER_SERVER[Moniteer Server]
        MNGINX[nginx]
        MAPI[Moniteer API]
        MDB[Monitoring DB]
    end

    subgraph REMOTE[Remote Access]
        DEV[Developer or Admin]
    end

    T1 -->|HTTP| FW
    T2 -->|HTTP| FW
    FW --> API
    API --> DB

    DEV -->|HTTPS| MNGINX
    MNGINX --> MAPI
    MAPI --> MDB
    MAPI -->|Health probes and snapshots| API
```
