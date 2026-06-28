# django_backend_innutrire — Flow Diagram

> A Django REST API that manages patient records, runs ML inference to predict REE, serves explainable AI outputs, and proxies monitoring data for the Moniteer agent.

---

## API Routing Overview

```mermaid
flowchart TD
    REQ([Incoming HTTP Request]) --> ROUTER[URL Router]

    ROUTER -->|/api/patients| PAT[Patient Handler]
    ROUTER -->|/api/predictions| PRED[Prediction Handler]
    ROUTER -->|/api/gold-standard| GS[Gold Standard Handler]
    ROUTER -->|/api/explainable-ai| XAI[Explainable AI Handler]
    ROUTER -->|/api/agent| AGENT[Monitoring Proxy Handler]
    ROUTER -->|/api/| HEALTH[Health Check]

    PAT & PRED & GS & XAI & AGENT & HEALTH --> RESP([JSON Response])
```

---

## Patient Operations

```mermaid
flowchart TD
    PAT([Patient Handler]) --> OP{Operation}

    OP -->|List| L1[Return all active patients]
    OP -->|Create| L2[Save new patient record]
    OP -->|View| L3[Return patient details]
    OP -->|Update| L4[Update patient details]
    OP -->|Delete| L5[Soft-delete — mark as deleted\nrecord is never removed]
    OP -->|Consent| L6[Record patient consent status]
    OP -->|Latest prediction| L7[Return most recent REE result]
    OP -->|Insights| L8[Compare latest vs previous REE\nreturn delta and trend direction]

    L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 --> RESP([JSON Response])
```

---

## Prediction & ML Inference

```mermaid
flowchart TD
    PRED([POST — Run Prediction]) --> RECEIVE[Receive clinical measurements]

    RECEIVE --> ML

    subgraph ML[ML Inference]
        FE[Feature engineering\nAverage repeated vitals\nClassify BMI and temperature\nEncode categorical fields]
        FE --> SCALE[Normalise features]
        SCALE --> SVR[SVR model predicts raw REE]
    end

    SVR --> ADJ[Apply injury factor\nREE x trauma or burns multiplier]
    ADJ --> SAVE[Save prediction to database]
    SAVE --> RESP[Return prediction ID, REE value\nand energy recommendation]
```

---

## Explainable AI

```mermaid
flowchart TD
    XAI([Explainable AI Handler]) --> TYPE{Request type}

    TYPE -->|Global feature importance| PFI[Permutation Feature Importance\nShuffle each feature across full dataset\nRank by impact on prediction error]
    PFI --> PFI_OUT[Return ranked feature list]

    TYPE -->|Local explanation| SHAP[SHAP Analysis\nCompute per-feature contribution\nfor a single patient]
    SHAP --> SHAP_OUT[Return contribution value per feature]
```

---

## Gold Standard Recording

```mermaid
flowchart TD
    GS([POST — Gold Standard]) --> LINK[Link to existing prediction]
    LINK --> SAVE[Save indirect calorimetry measurement\nRQ, heart rate, VO2, VCO2,\nreference REE, device brand]
    SAVE --> RESP[Return confirmation]
```

---

## Monitoring Proxy

```mermaid
flowchart TD
    AGENT([Monitoring Proxy Handler]) --> EP{Endpoint}

    EP -->|Ping| A1[Connection check]
    EP -->|Server health| A2[CPU, memory, disk usage and uptime]
    EP -->|Patients| A3[All patient records]
    EP -->|Predictions| A4[All predictions with gold standard data]
    EP -->|Tablet health| A5[Tablet connectivity status]
```

---

## Data Model Relationships

```mermaid
erDiagram
    Patient {
        int id PK
        string name
        string registration_number
        string bed_number
        string gender
        date date_of_birth
        date admission_date
        string status
        bool consent_given
    }
    Prediction {
        int id PK
        int patient_id FK
        float ree_value
        float energy_recommendation
        datetime created_at
    }
    GoldStandard {
        int id PK
        int prediction_id FK
        float reference_ree
        float respiratory_quotient
        datetime measurement_timestamp
    }

    Patient ||--o{ Prediction : "has many"
    Prediction ||--o| GoldStandard : "has one"
```

---

## Full Request Lifecycle

```mermaid
sequenceDiagram
    participant App as Desktop App
    participant API as Django API
    participant ML as ML Service
    participant DB as Database

    App->>API: POST clinical measurements
    API->>ML: Run feature engineering and prediction
    ML-->>API: Raw REE + energy recommendation
    API->>DB: Save prediction record
    DB-->>API: Prediction ID
    API-->>App: Prediction ID, REE value, recommendation
```
