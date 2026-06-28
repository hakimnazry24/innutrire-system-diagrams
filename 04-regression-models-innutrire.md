# Regression_models_innutrire — Flow Diagram

> ML research repository containing 87 Jupyter notebooks that explore data, compare regression algorithms, and produce the trained model deployed in the Django backend.

---

## Research Workflow

```mermaid
flowchart TD
    DATA([ICU Patient Dataset\n315 records]) --> EDA

    subgraph EDA[Exploratory Data Analysis]
        E1[Statistical profiling]
        E2[Calorimeter brand comparison]
        E3[Temperature measurement analysis]
        E4[Lab values analysis]
    end

    EDA --> PREP

    subgraph PREP[Preprocessing]
        P1[Filter outlier readings]
        P1 --> P2[Classify BMI and temperature]
        P2 --> P3[Encode categorical features]
        P3 --> P4[Impute missing values]
    end

    PREP --> TARGET

    subgraph TARGET[Target Strategy]
        T1[Cosmed measurements only]
        T2[GE measurements only]
        T3[Combined — use whichever is available]
        T4[Augmented — duplicate rows with both readings]
    end

    TARGET --> FS

    subgraph FS[Feature Selection]
        FS1[Recursive feature elimination\n30 features reduced to 22]
        FS2[Clinical knowledge selection\n14 features for deployment]
    end

    FS --> TRAIN[Model Training]
```

---

## Model Comparison

```mermaid
flowchart TD
    TRAIN([5-Fold Cross Validation]) --> MODELS

    subgraph MODELS[Algorithms Explored]
        M1[Linear Regression]
        M2[Ridge, Lasso, Elastic Net]
        M3[Random Forest]
        M4[Gradient Boosting]
        M5[Support Vector Regressor — Deployed]
        M6[K-Nearest Neighbours]
        M7[XGBoost]
        M8[CatBoost]
        M9[AutoGluon — automated ensemble]
        M10[Stacking ensemble]
        M11[Clustering then linear regression]
        M12[Deep learning stack]
    end

    MODELS --> EVAL

    subgraph EVAL[Evaluation]
        V1[RMSE — primary metric]
        V2[R-squared]
        V3[Accuracy within 10% and 20% bands]
        V4[Compared against 9 published clinical equations]
    end

    EVAL --> BEST[Best model selected\nSVR — RMSE 314 kcal\nOutperforms all clinical equations]
```

---

## Interpretability

```mermaid
flowchart TD
    BEST([Best Model — SVR]) --> XAI

    subgraph XAI[Explainability Analysis]
        S1[SHAP — per-feature contribution\nfor individual patients]
        S2[Permutation Importance — global\nfeature ranking by impact on error]
        S3[Counterfactual analysis\nwhat-if feature changes]
    end

    XAI --> TOP[Top predictive features\nBody weight, Age,\nMinute ventilation, Gender]
```

---

## Model Export

```mermaid
flowchart TD
    RETRAIN[Retrain on full dataset] --> BUNDLE[Bundle model into deployment package\nscaler plus SVR pipeline]
    BUNDLE --> EXPORT[Export as model artifact]
    EXPORT -->|Manual copy| DEPLOY[Drop into Django backend model folder]
    DEPLOY --> SERVE[Backend loads model on first prediction request]
```
