# moniteer — Flow Diagram

> A centralised web dashboard for monitoring all INNUTRIRE hospital deployments. It tracks infrastructure health, collects daily data snapshots from every hospital server, and gives administrators a single pane of glass across the entire network.

---

## Application Overview

```mermaid
flowchart TD
    subgraph MONITEER[Moniteer Web App]
        FE[React Dashboard]
        BE[Django REST API]
        DB[PostgreSQL Database]
    end

    subgraph HOSPITALS[Hospital Sites]
        H1[Hospital A\nINNUTRIRE Server]
        H2[Hospital B\nINNUTRIRE Server]
        H3[Hospital N\nINNUTRIRE Server]
    end

    ADMIN[Administrator] -->|Login and view dashboard| FE
    FE -->|API calls| BE
    BE --> DB

    BE -->|Live health probe| H1
    BE -->|Live health probe| H2
    BE -->|Live health probe| H3

    BE -->|Nightly snapshot collection| H1
    BE -->|Nightly snapshot collection| H2
    BE -->|Nightly snapshot collection| H3
```

---

## Page Navigation

```mermaid
flowchart TD
    LOGIN([Login Page]) -->|Authenticated| OVERVIEW

    OVERVIEW[Overview\nAll hospitals and live server status]

    OVERVIEW --> HOSPITALS[Hospitals\nList and manage hospital records]
    OVERVIEW --> SERVERS[Servers\nList and manage server records]
    OVERVIEW --> TABLETS[Tablets\nList and manage tablet records]
    OVERVIEW --> PATIENTS[Patients\nSnapshot data from all hospitals]
    OVERVIEW --> PREDICTIONS[Predictions\nSnapshot data from all hospitals]
    OVERVIEW --> GOLDSTD[Gold Standard\nSnapshot data from all hospitals]

    HOSPITALS -->|Select hospital| HOSDETAIL[Hospital Details\nLive server health cards]

    PATIENTS & PREDICTIONS & GOLDSTD -->|Expand row| DETAIL[Snapshot Detail\nFull record list for that snapshot]
```

---

## Live Server Health Monitoring

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant FE as React Frontend
    participant BE as Moniteer Backend
    participant INNUTRIRE as Hospital INNUTRIRE Server

    Admin->>FE: Open hospital details page
    FE->>BE: Request health for each server
    BE->>INNUTRIRE: Ping — is the server reachable?
    INNUTRIRE-->>BE: Online / Offline status
    BE->>INNUTRIRE: Fetch server health metrics
    INNUTRIRE-->>BE: CPU, memory, disk, uptime, process count
    BE-->>FE: Health data
    FE-->>Admin: Display server health cards

    note over FE: Overview page auto-refreshes every 60 seconds
```

---

## Nightly Snapshot Collection

```mermaid
flowchart TD
    CRON([Scheduled job — midnight daily]) --> CMD[Run snapshot command]

    CMD --> LOOP{For each active hospital server}

    LOOP --> P1[Fetch all patient records]
    LOOP --> P2[Fetch all predictions]
    LOOP --> P3[Fetch all gold standard readings]

    P1 & P2 & P3 --> STORE[Store as JSON snapshot in database\ntagged with server, hospital, and timestamp]

    STORE --> NEXT{More servers?}
    NEXT -->|Yes| LOOP
    NEXT -->|No| DONE[Snapshot complete]

    DONE --> VIEW[Data available on\nPatients, Predictions, Gold Standard pages]
```

---

## Manual Snapshot Trigger

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant FE as React Frontend
    participant BE as Moniteer Backend
    participant INNUTRIRE as Hospital INNUTRIRE Server

    Admin->>FE: Click Collect Snapshot
    FE->>BE: POST — trigger snapshot now
    BE->>INNUTRIRE: Fetch patients, predictions, gold standard
    INNUTRIRE-->>BE: Current data
    BE->>BE: Save snapshot to database
    BE-->>FE: Snapshot saved
    FE-->>Admin: Updated data appears in table
```

---

## Infrastructure Management

```mermaid
flowchart LR
    subgraph REGISTRY[Infrastructure Registry]
        HOS[Hospitals\nname, location, contact]
        SRV[Servers\nIP, port, specs, OS]
        TAB[Tablets\nhostname, IP, app version]
    end

    HOS -->|one hospital has many| SRV
    SRV -->|one server has many| TAB
    SRV -->|health checked via| AGENT[INNUTRIRE Agent endpoints]
```

---

## Data Architecture

```mermaid
flowchart TD
    subgraph LIVE[Live Monitoring]
        PING[Server ping — online or offline]
        HEALTH[Server health — CPU, memory, disk, uptime]
    end

    subgraph SNAPSHOTS[Snapshot Storage]
        PSNAP[Patient snapshots\ndaily JSON record per server]
        PRSNAP[Prediction snapshots\ndaily JSON record per server]
        GSSNAP[Gold standard snapshots\ndaily JSON record per server]
    end

    subgraph INFRA[Infrastructure Records]
        H[Hospital]
        S[Server]
        T[Tablet]
    end

    H --> S --> T
    S --> PING
    S --> HEALTH
    S --> PSNAP
    S --> PRSNAP
    S --> GSSNAP
```

---

## Deployment Architecture

```mermaid
flowchart TD
    subgraph MONITEER_SERVER[Moniteer Server]
        subgraph DOCKER[Docker Compose]
            NGINX[nginx\nServes React frontend\nReverses proxy to API]
            DJANGO[Django backend\nPort 8000]
            PG[PostgreSQL\nInternal only]
        end
    end

    ADMIN[Administrator browser] -->|HTTPS| NGINX
    NGINX -->|Static files| ADMIN
    NGINX -->|/api/ requests| DJANGO
    DJANGO --> PG

    DJANGO -->|HTTP — agent endpoints| H1[Hospital Server 1]
    DJANGO -->|HTTP — agent endpoints| H2[Hospital Server 2]
```
