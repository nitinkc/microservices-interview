# Spring Boot Microservices — Reference Architecture (Practical Blueprint)

> This is an opinionated blueprint you can reuse for most Spring Boot microservice systems.

---

## A) Core components (typical)
1. **API Gateway**
   - TLS termination, rate limiting, authn/z, routing
2. **Service Discovery** (optional if using Kubernetes)
3. **Config management**
   - env vars / config server / secrets manager
4. **Microservices** (domain services)
5. **Async messaging**
   - Kafka/Rabbit; event-driven integration
6. **Observability stack**
   - metrics (Prometheus), traces (Jaeger/Tempo), logs (ELK/Loki)

---

## B) Service internal layering
```
controller -> application/service -> domain -> repository/clients
```
- Keep domain logic outside adapters (controllers, persistence, HTTP clients).

---

## C) Communication patterns
### 1) Sync (REST/gRPC)
Use for read queries and immediate responses.

### 2) Async (events)
Use for:
- integration between bounded contexts
- eventual consistency
- audit trails

---

## D) Data consistency patterns
### Outbox pattern (must know)
- Write business data + outbox event in **same DB transaction**.
- A publisher reads outbox and publishes to broker.

### Saga pattern (must know)
- Orchestration: a saga coordinator commands services.
- Choreography: services publish events and react.

---

## E) Resilience defaults (starter settings)
- Connect timeout: 200–500ms (internal)
- Read timeout: p95 latency + margin
- Retry: 0–2 with jitter (idempotent only)
- Circuit breaker: sliding window 20–100 calls; failure threshold 50%

---

## F) Observability defaults
### 1) Health
- `/actuator/health/liveness`
- `/actuator/health/readiness`

### 2) Metrics
- request latency histograms
- JVM GC, heap, threads

### 3) Tracing
- sample 1–10% in prod; 100% in dev

---

## G) API versioning & compatibility
- Additive changes only, avoid breaking fields.
- Use tolerant readers for JSON.

---

## H) A lightweight folder structure
```
service-a/
  src/main/java/... 
  src/main/resources/application.yml
  Dockerfile
  helm/ (optional)
  README.md
```

---

## I) Checklist before production
- Actuator endpoints exposed safely
- Rate limiting and auth at gateway
- Structured logs with trace correlation
- Circuit breaker + timeouts configured
- Alerts on SLIs (latency, error rate, saturation)
- Load tests for critical paths


