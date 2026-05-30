# Spring Boot Microservices — Basics You'll Need (Cheat Sheet)

> A practical, beginner-to-intermediate checklist for building **Spring Boot microservices** with production concerns: configuration, resilience, observability, deployment.

---

## 1) What makes a service a microservice?
- **Single responsibility / bounded context** (domain-driven boundary)
- **Independently deployable** unit
- **Owns its data** (avoid shared DB)
- Communicates via **well-defined APIs** (HTTP/gRPC) and/or **events** (Kafka/Rabbit)

---

## 2) Minimal service template (recommended modules)
**Dependencies (typical):**
- `spring-boot-starter-web` (REST)
- `spring-boot-starter-validation`
- `spring-boot-starter-actuator` (health/metrics)
- `micrometer-registry-prometheus` (if Prometheus)
- `spring-boot-starter-security` (if needed)
- `spring-boot-starter-data-jpa` + DB driver (if relational)
- Resilience: `spring-cloud-starter-circuitbreaker-resilience4j`
- Tracing: `micrometer-tracing-bridge-otel` (Boot 3+)

---

## 3) API design essentials
### DTOs & validation
```java
record CreateOrderRequest(
  @jakarta.validation.constraints.NotBlank String customerId,
  @jakarta.validation.constraints.Positive int quantity
) {}
```

### Controller best practices
- Keep controllers thin (delegate to service layer)
- Use `@ControllerAdvice` for consistent error responses
- Use versioning (`/v1/...`) or header-based versioning

---

## 4) Data patterns you’ll actually need
### Database-per-service
- Each service owns its schema.
- Cross-service queries happen via APIs or events.

### Transactions across services (don’t do 2PC)
- Prefer **Saga pattern** (choreography via events or orchestration).
- Use **Outbox pattern** to publish events reliably from DB.

---

## 5) Resilience patterns (must know)
### Circuit breaker + timeout + bulkhead
```java
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;

@Service
class PricingClient {
  @CircuitBreaker(name = "pricing", fallbackMethod = "fallback")
  String getPrice(String sku) {
    // call downstream
    throw new RuntimeException("downstream failed");
  }

  String fallback(String sku, Throwable t) {
    return "PRICE_UNAVAILABLE";
  }
}
```
**Rules of thumb:**
- Timeouts everywhere (client & server).
- Retries only for safe/idempotent ops.
- Bulkheads to avoid thread/connection pool exhaustion.

---

## 6) Observability (logs + metrics + traces)
### Actuator & health
```properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=when_authorized
```

### Structured logging
- Include `traceId` / `spanId` in logs (log correlation).

### Tracing (OpenTelemetry)
- Use Micrometer Tracing bridge (Boot 3+) or OTel Java agent.

---

## 7) Configuration & secrets
- Use env vars / config server, never hardcode secrets.
- Externalize config per environment: dev/test/prod.

---

## 8) Security basics
- Prefer OAuth2/OIDC with JWT for service-to-service.
- Validate tokens at the edge (gateway) AND at services for defense-in-depth.

---

## 9) Testing pyramid for microservices
- Unit tests (fast)
- Slice tests (`@WebMvcTest`, `@DataJpaTest`)
- Contract tests (consumer-driven contracts)
- Integration tests with Testcontainers

---

## 10) Deployment basics
- Containerize (Docker)
- Health probes: readiness/liveness via Actuator
- Resource limits (CPU/memory)
- Rolling deployments + backward compatible APIs

---

## Common interview questions
- Why database-per-service?
- How do you do distributed transactions?
- What are timeouts/retries/circuit breakers and how do you tune them?
- How do you debug latency across services?

---

## References (official docs to bookmark)
- Spring Boot Actuator docs
- Spring Cloud Circuit Breaker docs
- OpenTelemetry Java instrumentation docs


