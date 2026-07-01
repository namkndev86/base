# Enterprise NestJS Core Platform Microservices System Architecture

This document describes the high-performance core microservices blueprint for the enterprise backend.

---

## 1. System Infrastructure Layout

This diagram illustrates how external users access the platform via the API Gateway, and how requests are routed synchronously (gRPC) or asynchronously (NATS) to the internal backing stores and monitoring systems.

```mermaid
graph TD
    Client[Web/Mobile Client] -->|HTTP REST/HTTPS| Gateway[API Gateway: Port 3000]
    
    subgraph Core Platform Services
        Gateway -->|HTTP Proxy| Identity[Identity Service: Port 3001]
        Gateway -->|HTTP Proxy| Tenant[Tenant Service: Port 3003]
        Gateway -->|HTTP Proxy| Auth[Authorization Service: Port 3002]
        
        Gateway -.->|gRPC ValidateToken| Identity
        Identity -.->|gRPC GetTenant| Tenant
        Gateway -.->|gRPC CheckPermission| Auth
    end

    subgraph Messaging & Storage
        Identity -->|Emit user.created| NATS[NATS Broker: Port 4222]
        Tenant -->|Emit tenant.created| NATS
        
        NATS -->|Subscribe| Audit[Audit Service]
        NATS -->|Subscribe| Notification[Notification Service]
        
        Identity ===|SQL| PG[(PostgreSQL: Port 5432)]
        Tenant ===|SQL| PG
        Auth ===|SQL| PG
        
        Gateway ===|Session/RateLimit| Redis[(Redis: Port 6379)]
    end

    subgraph Observability
        Gateway -->|Metrics| Prom[Prometheus: Port 9090]
        Identity -->|Metrics| Prom
        Prom --> Grafana[Grafana Dashboard: Port 3000]
        Gateway -->|Tracing| Jaeger[Jaeger UI: Port 16686]
    end
```

---

## 2. Core Request Flow Sequence Diagram

This sequence diagram depicts an API request targeting a protected resource. It illustrates Correlation ID injection, JWT token validation using gRPC, and downstream header forwarding.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway
    participant Identity as Identity Service (gRPC)
    participant Auth as Authorization Service (gRPC)
    participant Downstream as Downstream Service (e.g. Audit)

    Client->>Gateway: GET /audit/logs (Authorization: Bearer <token>)
    Note over Gateway: CorrelationIdMiddleware generates or propagates x-correlation-id
    Gateway->>Identity: gRPC: ValidateToken(accessToken)
    activate Identity
    Note over Identity: Decodes & verifies signature using JwtService
    Identity-->>Gateway: ValidateTokenResponse (userId, tenantId, roles, email, isValid: true)
    deactivate Identity

    Gateway->>Auth: gRPC: CheckPermission(userId, "read:logs", tenantId)
    activate Auth
    Note over Auth: Evaluates RBAC/ABAC policies
    Auth-->>Gateway: CheckPermissionResponse (isAllowed: true)
    deactivate Auth

    Note over Gateway: Injects user metadata headers (x-user-id, x-tenant-id)
    Gateway->>Downstream: Forward HTTP request (headers intact)
    activate Downstream
    Note over Downstream: Handles request using @CurrentUser context
    Downstream-->>Gateway: HTTP 200 OK (Data payload)
    deactivate Downstream
    Gateway-->>Client: HTTP 200 OK (ApiResponse with correlationId)
```

---

## 3. Clean Architecture Design Layers

Every microservice in this platform follows the **Clean Architecture** directory pattern, separating code by business rules, application orchestrations, and framework configurations:

1. **Domain Layer (`src/domain/`)**
   - Contains pure business logic aggregates, entities, value objects, and domain exceptions.
   - Absolutely zero references to database ORMs (Prisma) or NestJS frameworks.
2. **Application Layer (`src/application/`)**
   - Holds CQRS commands, queries, application services, and port interfaces (like `IUserRepository`).
   - Drives execution logic and event dispatchers.
3. **Infrastructure Layer (`src/infrastructure/`)**
   - Outlines adapters that implement the domain ports.
   - Houses database repositories (Prisma adapters), HTTP external clients, and NATS event consumers.
4. **Presentation Layer (`src/presentation/`)**
   - Rest REST controllers and gRPC route mappings.
   - Responsible for serializing DTO inputs and handling standard HTTP status responses.

---

## 4. API Gateway Endpoints & Aggregate OpenAPI Specs

### Authentication
- `POST /v1/identity/register`: Creates a new user record. Emits `user.created`.
- `POST /v1/identity/login`: Authenticates user credentials. Returns JWT tokens.
- `POST /v1/identity/refresh`: Re-issues access tokens using refresh tokens.
- `GET /v1/identity/me`: Retrieves current active profile.

### Multi-Tenant Provisioning
- `POST /v1/tenant`: Registers a new tenant and database scoping. Emits `tenant.created`.
- `POST /v1/tenant/organization`: Generates tenant-scoped organizational business unit.

### Authorization Management
- `POST /v1/authorization/assign-role`: Assigns global or tenant-scoped roles.
- `GET /v1/authorization/permissions`: Evaluates and lists active permissions.

---

## 5. Security & Isolation Controls

1. **Correlation IDs**: Propagated via `x-correlation-id` headers across all service boundaries. Allows structured trace logging in Jaeger.
2. **API Rate Limiting**: Managed at the gateway using a sliding-window algorithm backed by Redis.
3. **Multi-Tenant Data Isolation**: Implemented using a shared-database, tenant-discriminator structure. All queries filter by `tenantId` (automatically retrieved from the JWT token and injected via `@CurrentUser`).
4. **Transport Security**: gRPC communication is configured for TLS in production. Internal REST calls bypass the gateway but validate incoming user headers injected by the gateway.
