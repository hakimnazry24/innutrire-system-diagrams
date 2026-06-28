# frontend_innutrire — Flow Diagram

> A desktop application for ICU clinicians to register patients, enter clinical measurements, and receive AI-powered REE (Resting Energy Expenditure) predictions.

---

## Screen Navigation

```mermaid
flowchart TD
    A([App Launch]) --> B[Patient List]

    B --> C{User action}
    C -->|Add new patient| D[Add Patient Form]
    C -->|Select patient| E[Patient Dashboard]

    D --> D1[Fill in patient details]
    D1 --> D2[Save patient]
    D2 --> B

    E --> E1[View patient info and recent prediction]
    E --> F{Dashboard action}

    F -->|REE Calculation| G[REE Calculation Wizard]
    F -->|History| H[Prediction History]
    F -->|Predictive Equations| I[Equation Comparison]
    F -->|Edit patient| J[Edit Patient Form]
    F -->|Record consent| K[Consent Dialog]
```

---

## REE Calculation Wizard

```mermaid
flowchart TD
    START([Open REE Wizard]) --> S0

    S0[Step 1 — Gold Standard\nIndirect calorimetry measurements]
    S0 -->|Complete| S1

    S1[Step 2 — Demographics\nBody weight and anthropometrics]
    S1 -->|Complete| S2

    S2[Step 3 — Severity Scores\nAPACHE II, SOFA, SAPS2, NUTRIC]
    S2 -->|Complete| S3

    S3[Step 4 — Vital Signs\nTemperature, heart rate, respiration, tidal volume]
    S3 -->|Complete| S4

    S4[Step 5 — Injury Details\nTrauma and burns severity]
    S4 -->|Complete| S5

    S5{All steps complete?}
    S5 -->|No| S2
    S5 -->|Yes| CALC[Calculate button enabled]
    CALC --> SUBMIT([Clinician clicks Calculate])
```

---

## Prediction Submission & Result

```mermaid
sequenceDiagram
    actor C as Clinician
    participant App as Desktop App
    participant API as Backend API

    C->>App: Clicks Calculate
    App->>API: Submit clinical measurements
    API-->>App: REE prediction + energy recommendation

    App->>API: Submit gold standard IC measurements
    API-->>App: Confirmed

    App->>C: Display AI REE result and recommendation
```

---

## History & Comparison Views

```mermaid
flowchart LR
    RESULT[Prediction Result] --> OPT{View options}

    OPT -->|History tab| HIST[List of past predictions with timestamps]
    OPT -->|Trend tab| TREND[Chart of REE values over time]
    OPT -->|Predictive Equations| COMP[Side-by-side comparison table\nAI vs clinical formula estimates]
```
