# INNUTRIRE — System Diagrams

Mermaid flow diagrams documenting the architecture and workflows of the INNUTRIRE hospital nutrition management system and its monitoring layer.

## Diagrams

| File | Repo | What it covers |
|------|------|----------------|
| [01-frontend-innutrire.md](01-frontend-innutrire.md) | `frontend_innutrire` | Desktop app screen flow, 5-step REE wizard, prediction submission |
| [02-django-backend-innutrire.md](02-django-backend-innutrire.md) | `django_backend_innutrire` | REST API routing, ML inference pipeline, explainable AI, data models |
| [03-hospital-server-deployment-iac.md](03-hospital-server-deployment-iac.md) | `hospital-server-deployment-iac` | Ansible provisioning phases, Docker Compose services, network access |
| [04-regression-models-innutrire.md](04-regression-models-innutrire.md) | `Regression_models_innutrire` | ML research workflow, model comparison, interpretability, model export |
| [05-system-overview.md](05-system-overview.md) | **All repos** | End-to-end prediction flow, monitoring flow, repo roles, infrastructure topology |
| [06-moniteer.md](06-moniteer.md) | `moniteer` | Monitoring dashboard — live health probes, nightly snapshots, page navigation |

## System at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│  Regression_models_innutrire  (offline ML research)              │
│  Train → evaluate → export SVR model                            │
└──────────────────────────┬───────────────────────────────────────┘
                           │ deploy model artifact
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  hospital-server-deployment-iac  (Ansible — run once per site)   │
│  Provision Ubuntu server → Docker Compose: web + db              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ provisions and deploys
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  django_backend_innutrire  (always running on hospital server)   │
│  REST API — patients, predictions, XAI, agent proxy endpoints    │
└──────────┬───────────────────────────────────┬───────────────────┘
           │ HTTP REST API                      │ agent endpoints
           ▼                                    ▼
┌─────────────────────────┐      ┌──────────────────────────────────┐
│  frontend_innutrire     │      │  moniteer                        │
│  PySide6 desktop app    │      │  Web dashboard — live health,    │
│  ICU bedside tablet     │      │  nightly snapshots, infra mgmt   │
└─────────────────────────┘      └──────────────────────────────────┘
```

## Viewing Diagrams

GitHub renders Mermaid diagrams natively in Markdown files. Open any `.md` file above to see the rendered diagram.

For local preview: use [Mermaid Live Editor](https://mermaid.live) or a VS Code extension with Mermaid support.

## Generating PDFs

```bash
npm install       # first time only
npm run pdf       # renders all diagrams to pdf/
```

PDFs are generated as A3 landscape using headless Chrome with a locally bundled Mermaid renderer.
