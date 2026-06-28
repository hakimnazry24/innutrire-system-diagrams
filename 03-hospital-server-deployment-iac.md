# hospital-server-deployment-iac — Flow Diagram

> Ansible playbooks that provision an on-premise Ubuntu server from scratch and deploy the Django backend via Docker Compose.

---

## Provisioning Flow

```mermaid
flowchart TD
    START([Engineer runs Ansible playbook]) --> CFG[Load configuration\npasswords, VPN key, network settings, repo URL]

    CFG --> P1

    subgraph P1[Phase 1 — System Users]
        U1[Create admin user accounts]
        U1 --> U2[Grant Docker and sudo access]
    end

    P1 --> P2

    subgraph P2[Phase 2 — Network]
        N1[Assign static IP address to server]
    end

    P2 --> P3

    subgraph P3[Phase 3 — SSH]
        S1[Restrict SSH access to admin users only]
    end

    P3 --> P4

    subgraph P4[Phase 4 — VPN]
        V1[Install Tailscale]
        V1 --> V2[Connect server to secure mesh network]
    end

    P4 --> P5

    subgraph P5[Phase 5 — Firewall]
        F1[Allow SSH, HTTP, HTTPS]
        F1 --> F2[Allow VPN traffic]
        F2 --> F3[Deny all other inbound traffic]
    end

    P5 --> P6

    subgraph P6[Phase 6 — Docker]
        D1[Install Docker Engine and Compose]
    end

    P6 --> P7

    subgraph P7[Phase 7 — Application]
        A1[Clone backend repository from GitHub]
        A1 --> A2[Copy environment configuration]
        A2 --> A3[Build and start containers]
    end
```

---

## Running Services

```mermaid
flowchart TD
    subgraph SERVER[Ubuntu Server]
        subgraph DOCKER[Docker Compose]
            WEB[Web container\nDjango REST API\nPort 8000]
            DB[Database container\nPostgreSQL\nInternal only]
        end
        FW[Firewall]
        VPN[Tailscale VPN]
    end

    WEB -->|reads and writes| DB
    FW -->|allows port 8000| WEB
    TABLET[ICU Tablets] -->|HTTP requests| FW
    ADMIN[Remote admin] -->|secure tunnel| VPN
    VPN --> FW
```

---

## Network Access

```mermaid
flowchart LR
    subgraph CLIENTS[Clients]
        ICU[ICU Tablet\nDesktop App]
        REMOTE[Remote Admin\nvia VPN]
        SSH[Developer\nSSH]
    end

    subgraph FIREWALL[Firewall]
        ALLOW[Allowed traffic\nSSH, HTTP, VPN]
        DENY[All other traffic\nblocked]
    end

    subgraph BACKEND[Server]
        API[Django API]
        DB[PostgreSQL]
    end

    ICU -->|HTTP| ALLOW
    SSH -->|SSH| ALLOW
    REMOTE -->|VPN tunnel| ALLOW
    ALLOW --> API
    API --> DB
```
