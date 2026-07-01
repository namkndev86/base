# Agent Governance for feature-flag-service

This file defines constraints and instructions for AI agents modifying this microservice.

## Service Boundary
- This is the **feature-flag-service** of the NestJS Core Platform.
- It conforms strictly to DDD & Clean Architecture.
- Avoid introducing business domain concepts.

## Design Rules
1. **Domain Model**: Pure models under `src/domain`. No framework dependencies.
2. **Application Rules**: Commands, Queries, Handlers under `src/application`.
3. **Infrastructure**: Database repositories, gRPC, and REST routes under `src/infrastructure` and `src/presentation`.
