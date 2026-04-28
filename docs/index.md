# Microservices Interview Guide

> Scenario-based interview preparation for microservices architecture and distributed systems.

This site is a **practical interview guide** covering microservices design patterns, resilience, communication, observability, and deployment — with concise, interview-ready answers.

---

## Topic Map

```mermaid
mindmap
  root((Microservices\nArchitect\nPlaybook))
    Fundamentals
      Resilience and Fault Tolerance
        Circuit Breaker
        Bulkhead
        Fallback
      Service Communication
        gRPC vs REST
        API Gateway
        Idempotency
    Scalability and Data
      Performance and Scalability
        Latency · Auto-scaling
        Caching Strategies
      Data Consistency
        Saga Pattern
        Transactional Outbox
        Eventual Consistency
    Operations
      Observability
        Distributed Tracing
        Centralized Logging
        Metrics and Alerting
      Deployment
        Canary · Blue-Green
        Feature Flags
        API Versioning
    Architect Level
      Security
        OAuth2 and JWT
        mTLS · Zero Trust
      Spring Cloud
        WebClient · Feign
        Config Server
      Kubernetes
        Docker Best Practices
        Secrets Management
        Service Mesh
      Architecture Patterns
        Strangler Fig
        DDD · Bounded Context
        Sidecar · Outbox
      CI-CD and Team
        Jenkins Pipeline
        Tech Debt Strategy
        Incident Handling
```

---

## Sections

### Fundamentals

| # | Section | Topics |
|---|---------|--------|
| 1 | [Resilience & Fault Tolerance](interview/01-microservices-resilience.md) | Circuit breakers, bulkheads, fallbacks, partial failures |
| 2 | [Service Communication](interview/02-service-communication.md) | Retries, idempotency, gRPC, API Gateway, service mesh |

### Scalability & Data

| # | Section | Topics |
|---|---------|--------|
| 3 | [Performance & Scalability](interview/03-performance-scalability.md) | Latency, bottlenecks, auto-scaling, load distribution |
| 4 | [Data Consistency](interview/04-data-consistency.md) | Saga pattern, event deduplication, eventual consistency |

### Operations

| # | Section | Topics |
|---|---------|--------|
| 5 | [Observability & Debugging](interview/05-observability.md) | Distributed tracing, centralized logging, metrics |
| 6 | [Deployment & Compatibility](interview/06-deployment-compatibility.md) | API versioning, canary deployments, feature flags |

### Architect Level

| # | Section | Topics |
|---|---------|--------|
| 7 | [Advanced Patterns](interview/07-advanced-patterns.md) | CQRS, event sourcing, async APIs, saga orchestration |
| 8 | [Security & Resilience4j](interview/08-security.md) | OAuth2, JWT, mTLS, Spring Cloud Gateway, circuit breaker config |
| 9 | [Spring Cloud & Frameworks](interview/09-spring-cloud.md) | WebClient, Feign, Config Server, Actuator probes |
| 10 | [Containers & Kubernetes](interview/10-kubernetes-containers.md) | Docker best practices, K8s deployment, secrets, service mesh |
| 11 | [Architecture & Design Patterns](interview/11-architecture-patterns.md) | Strangler Fig, BFF, Sidecar, Outbox pattern, DDD decomposition |
| 12 | [CI/CD & Team Leadership](interview/12-cicd-team.md) | Pipelines, monolith migration, incident handling, tech debt |

---

## How to Use

Each section contains collapsible interview questions — click to expand the answer.

- Answers are **2–5 lines**, concise and interview-ready.
- Questions are scenario-based: *"Your system does X. How will you handle it?"*
- Hover over underlined terms for inline definitions.

--8<-- "_abbreviations.md"
