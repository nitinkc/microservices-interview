# Microservices Design Interview Questions — Critical Thinking Edition
> These are **not syntax questions**. They test whether the candidate has *actually designed, broken, and fixed* distributed systems. There are no single "correct" answers — probe the reasoning, not the conclusion.

---

## Ground Rules for the Interviewer
- Say: **"Walk me through your thinking"** — the reasoning matters more than the answer.
- Push back even on correct answers: **"What could go wrong with that?"**
- Watch for: buzzword soup without depth ("just use Kafka", "put it in Redis") vs. someone who explains trade-offs.
- These questions have **intentional traps** and **no perfect answer** — that is the point.

---

## SECTION A — Service Design & Boundaries

---

### Q1. The God Service Smell

> You join a team. The `OrderService` handles: placing orders, calculating discounts, sending confirmation emails, updating inventory, generating invoices, and notifying the warehouse. It has 47 REST endpoints and 200+ database tables.

**Question:** Is this a microservice? How would you break it up — and more importantly, what is your process for deciding the boundaries?

**What a weak answer looks like:**
- "Split it into smaller services" (no criteria given)
- Splits purely by tech layer ("put emails in one service, DB in another")

**What a strong answer looks like:**
- Uses **Domain-Driven Design** — identify bounded contexts: Order Management, Pricing, Notification, Inventory, Invoicing, Fulfilment
- Asks: *"What changes together should stay together"* (cohesion)
- Acknowledges the **strangler fig pattern** for incremental migration, not a big-bang rewrite
- Warns about **distributed monolith** — splitting services that still share a DB is worse than the original

**Critical follow-up:** If you split `OrderService` and `InventoryService`, they now need to stay consistent. How? (Saga pattern, eventual consistency — not a distributed transaction.)

**Concepts:** DDD, bounded contexts, cohesion, strangler fig, distributed monolith

---

### Q2. The Shared Database Trap

> Two teams share a single PostgreSQL database. `OrderService` and `ShippingService` both read/write the `orders` table directly.

```
OrderService  ──┐
                ├──► orders table (shared DB)
ShippingService─┘
```

**Question:** What are the problems with this design? The teams argue it's "simpler" — how do you convince them otherwise?

**What a weak answer looks like:**
- "It's bad practice" (no reasoning)
- Only mentions performance

**What a strong answer looks like:**
- **Schema coupling**: if `OrderService` renames a column, `ShippingService` breaks silently
- **Deployment coupling**: you can't deploy independently
- **Data ownership is unclear**: who is the source of truth for order status?
- **Scaling independently** becomes impossible
- Fix: each service owns its data; `ShippingService` gets order data via **API call** or **event** (order placed event), maintains its own read model

**Critical follow-up:** If they move to separate DBs, how does `ShippingService` know when an order is ready to ship? (Event-driven — `OrderPlaced` event on a message broker.)

**Concepts:** Database-per-service, coupling, data ownership, event-driven architecture

---

### Q3. How Fine Is "Micro"?

> A team proposes a separate microservice just to send emails — `EmailService`. It has one endpoint: `POST /send`. It wraps an SMTP library. No business logic.

**Question:** Is this a good microservice? What criteria determine if something deserves to be its own service?

**What a weak answer looks like:**
- "Yes, it's small so it's good"
- "No, it's too small" (without explaining the cost)

**What a strong answer looks like:**
- A service boundary should map to a **business capability**, not a technical function
- Ask: does this change independently? Does it have its own domain model? Does it need to scale independently?
- A thin SMTP wrapper is likely a **library**, not a service — unless it adds: template management, delivery tracking, retry logic, suppression lists, rate limiting per tenant
- **Nanoservices** are an anti-pattern: too many services = too much network overhead, too many deployment pipelines, too much distributed tracing complexity
- A better model: `NotificationService` that handles email, SMS, push — one domain, multiple channels

**Critical follow-up:** If later you need to support WhatsApp and SMS too — does your design accommodate that without adding new services each time?

**Concepts:** Service granularity, nanoservice anti-pattern, business capability, cohesion

---

## SECTION B — Communication & Resilience

---

### Q4. The Synchronous Chain of Death

> The checkout flow calls services in sequence, all synchronously over HTTP:

```
Client → API Gateway → OrderService → PaymentService → InventoryService → NotificationService
```

**Question:** What is the failure mode here? What happens if `NotificationService` is slow?

**What a weak answer looks like:**
- "Add a timeout"
- "Use a circuit breaker" (without explaining why or what it does)

**What a strong answer looks like:**
- **Cascading failures**: one slow service holds a thread in every upstream service → thread pool exhaustion → entire chain degrades
- **Latency multiplication**: each hop adds latency; 4 services × 200ms = 800ms minimum, plus variance
- **Availability multiplication**: if each service is 99.9% available → chain is `0.999^4 = 99.6%`
- Solutions:
  - Break the chain: `NotificationService` is **async** — publish an event instead of a sync call
  - **Circuit breaker** (Resilience4j): fail fast instead of waiting
  - **Bulkhead**: isolate thread pools so `NotificationService` slowness doesn't exhaust `OrderService`'s pool
  - **Timeout + retry with exponential backoff** for genuinely synchronous steps

**Critical follow-up:** Payment must be synchronous (you need a yes/no before confirming the order). How do you design just that part to be resilient?

**Concepts:** Cascading failures, circuit breaker, bulkhead, async vs sync, availability math

---

### Q5. Exactly-Once vs At-Least-Once

> `OrderService` publishes an `OrderPlaced` event to Kafka. `InventoryService` consumes it and decrements stock. Due to a network hiccup, the event is delivered **twice**.

**Question:** What happens? How do you prevent double-decrement?

**What a weak answer looks like:**
- "Use exactly-once delivery in Kafka" (doesn't explain idempotency)
- "It won't happen in production"

**What a strong answer looks like:**
- Kafka (and most brokers) guarantee **at-least-once** delivery by default; exactly-once is possible but has overhead and caveats
- The real fix is **idempotent consumers**: track which event IDs have been processed
- Store `event_id` in a `processed_events` table; check before processing — if already seen, skip
- This is the **idempotency key** pattern
- Alternatively: make the operation itself idempotent — instead of `stock -= 1`, use `SET stock = X WHERE stock = X+1`

**Critical follow-up:** Your idempotency check and the inventory decrement are two separate DB operations. What if the service crashes between them? (Outbox pattern or transactional inbox.)

**Concepts:** At-least-once delivery, idempotency, idempotency keys, outbox pattern

---

### Q6. The Saga Pattern — Compensating Transactions

> A travel booking system: booking a trip requires reserving a **flight**, a **hotel**, and a **car**. Each is a separate microservice. Hotel reservation succeeds. Car reservation fails.

```
FlightService  ✅ booked
HotelService   ✅ booked
CarService     ❌ failed
```

**Question:** The overall booking should be atomic — either all succeed or none do. How do you handle this without a distributed transaction (2PC)?

**What a weak answer looks like:**
- "Use a database transaction" (misses the point — these are separate services/DBs)
- "Use XA transactions / 2PC" (technically possible but explains no trade-offs)

**What a strong answer looks like:**
- **Saga pattern**: a sequence of local transactions; on failure, execute **compensating transactions**
  - Cancel flight booking (`FlightService.cancel(bookingId)`)
  - Cancel hotel booking (`HotelService.cancel(bookingId)`)
- Two saga implementations:
  - **Choreography**: each service emits events and reacts to others — decentralised, harder to debug
  - **Orchestration**: a `BookingOrchestrator` drives the saga — easier to trace, single point of logic
- Compensating transactions must be **idempotent** and **retryable**

**Critical follow-up:** What if the compensation for the flight also fails? (Retry with exponential backoff; dead-letter queue; human intervention / alerting — you can't guarantee compensation always succeeds, so you need observability.)

**Concepts:** Saga pattern, compensating transactions, choreography vs orchestration, distributed consistency

---

## SECTION C — Data & Consistency

---

### Q7. CQRS — When Is It Worth It?

> A product catalogue has 10,000 reads per second and 5 writes per second. The team proposes **CQRS** (Command Query Responsibility Segregation).

**Question:** Is CQRS a good fit here? What are the costs they might be underestimating?

**What a weak answer looks like:**
- "Yes, CQRS is always good for scale"
- "No, it's too complex" (without nuance)

**What a strong answer looks like:**
- The **read/write asymmetry** (10,000:5) is a classic CQRS use case — separate read models can be denormalised, cached, scaled independently
- But costs are real:
  - **Eventual consistency** between write model and read model — reads may lag
  - **Operational complexity**: two models, two data stores, synchronisation pipeline
  - **Debugging complexity**: bugs can exist in the projection/sync layer
- Better question: **can you solve this without CQRS first?** A read replica + caching (Redis) might handle 10,000 reads without the complexity
- CQRS earns its cost when: read/write models are structurally different, not just volume different

**Critical follow-up:** A user updates their profile. They immediately refresh the page and see the old data. How do you handle this UX problem in an eventually consistent CQRS system? (Read-your-writes pattern: read from the write model briefly after a write, or use a version/timestamp.)

**Concepts:** CQRS, eventual consistency, read replicas, read-your-writes, operational cost

---

### Q8. The Dual Write Problem

> `OrderService` needs to save an order to its database **and** publish an `OrderPlaced` event to Kafka — in the same operation.

```java
orderRepo.save(order);          // Step 1
kafkaTemplate.send("orders", event); // Step 2 — what if this fails?
```

**Question:** What are the failure scenarios? How do you make this reliable?

**What a weak answer looks like:**
- "Wrap it in a try-catch"
- "Use a transaction" (you can't span a DB and Kafka in one transaction easily)

**What a strong answer looks like:**
- **Dual write is inherently unsafe**: if the DB write succeeds but Kafka publish fails → event is lost, downstream services never know the order was placed
- If Kafka publishes first and DB write fails → phantom event for a non-existent order
- Fix: **Transactional Outbox Pattern**:
  1. Write order AND an `outbox` record in the **same DB transaction**
  2. A separate **relay process** (e.g., Debezium CDC) reads the outbox table and publishes to Kafka
  3. Once published, mark outbox record as sent
- This ensures at-least-once event delivery with no dual write risk

**Critical follow-up:** Debezium reads the DB transaction log (WAL). What happens if Debezium is down for 2 hours? (Events queue up in the outbox table and are replayed when Debezium recovers — this is the durability benefit.)

**Concepts:** Dual write problem, outbox pattern, CDC (Change Data Capture), Debezium, transactional guarantees

---

## SECTION D — Observability & Operations

---

### Q9. Debugging a Distributed Request — No Logs Correlate

> A user reports: "My order confirmation never arrived." You have 8 microservices involved in the flow. Each service logs independently. There is no shared request ID.

**Question:** How do you debug this? What should have been in place to make this easy?

**What a weak answer looks like:**

- "Check each service's logs one by one"
- "Add more logging"

**What a strong answer looks like:**

- Root cause: missing **distributed tracing** and **correlation IDs**
- What should be in place:
  - **Correlation ID** (trace ID) generated at the API Gateway, propagated in headers (`X-Correlation-ID`) through every service call and event
  - Every log line includes the trace ID → grep across all services instantly
  - **Distributed tracing** (OpenTelemetry + Jaeger/Zipkin): visualise the entire request as a trace with spans per service
  - **Structured logging** (JSON) so logs are queryable in tools like Grafana Loki, ELK, or Datadog
- For the specific "email not sent" case: the trace would show exactly which service dropped the ball

**Critical follow-up:** Your trace shows `NotificationService` received the event but the span ends there — no error, no next step. What could cause a silent failure? (Unhandled exception caught and swallowed, wrong topic subscribed, message deserialization failure silently discarded.)

**Concepts:** Distributed tracing, correlation IDs, OpenTelemetry, structured logging, observability pillars (logs, metrics, traces)

---

### Q10. Cascading Config Change — Who Broke Production?

> Your system has 12 microservices. All of them read from a central config server. A developer pushes a config change that accidentally sets `db.pool.size=0`. Within 60 seconds, all 12 services start failing DB connections.

**Question:** What went wrong architecturally? How do you prevent this class of failure?

**What a weak answer looks like:**

- "The developer should have been more careful"
- "Add code review for config changes"

**What a strong answer looks like:**

- **Blast radius too large**: one config change kills everything simultaneously
- Mitigations:
  - **Config versioning and approval gates** — config changes go through CI/CD with validation
  - **Schema validation** on config values — `pool.size` must be > 0, validated before deployment
  - **Canary/progressive rollout** of config changes — deploy to 1 service or 1% traffic first
  - **Circuit breaker on config refresh** — if new config causes connection failures, fall back to last known good config
  - **Immutable config per deployment** — bake config into the image, don't pull at runtime; reduces dynamic blast radius
  - **Separate config domains** per service — shared config only for truly global values

**Critical follow-up:** How do you design a rollback mechanism for config changes that have already propagated to all 12 services?

**Concepts:** Config management, blast radius, progressive delivery, circuit breaker, GitOps

---

## SECTION E — Security & Cross-Cutting Concerns

---

### Q11. JWT in Every Service — Who Validates It?

> The API Gateway validates JWTs. But individual microservices are also directly accessible on the internal network. The team says: "It's fine — the gateway is the only entry point."

**Question:** What is the security risk? How should auth work in a microservice mesh?

**What a weak answer looks like:**

- "It's fine because of the firewall"
- "Every service should validate JWT" (without explaining service-to-service auth)

**What a strong answer looks like:**

- **Perimeter security is not enough**: rogue internal services, compromised pods, or misconfigured network policies can bypass the gateway
- **Defence in depth**: each service should validate tokens even on internal calls
- But **service-to-service calls** are different from user calls:
  - Use **mutual TLS (mTLS)** between services (each service has a certificate, verified both ways) — this is what a service mesh (Istio, Linkerd) provides
  - Or use short-lived **service tokens** (e.g., OAuth2 client credentials) per service
- **Zero trust model**: never trust the network; always authenticate and authorise at the service level
- For user context propagation: pass the JWT downstream but validate signature at each service, or use a **token exchange** pattern

**Critical follow-up:** Service A calls Service B with a user's JWT. Service B makes a further call to Service C — should it pass the original user JWT or its own service token? What are the trade-offs? (User JWT = full user context but token audience mismatch; service token = correct auth but loses user identity; token exchange = correct but complex.)

**Concepts:** Zero trust, mTLS, service mesh, defence in depth, JWT propagation, OAuth2

---

### Q12. The Versioning Problem — Breaking Changes in APIs

> `OrderService` v1 returns:
> ```json
> { "orderId": 1, "status": "PLACED" }
> ```
> The team needs to rename `status` → `orderStatus` and add a required field `customerId`. Two other services consume this API.

**Question:** How do you make this change without breaking consumers?

**What a weak answer looks like:**

- "Just update all consumers at the same time"
- "Put it in a new endpoint"

**What a strong answer looks like:**

- **Never remove or rename fields in a shared API without versioning** — that is a breaking change
- Strategies:
  - **Additive changes only**: add `orderStatus` alongside `status` (keep both), add `customerId` as optional first
  - **URI versioning**: `/v2/orders/{id}` — maintain v1 alongside v2 for a deprecation window
  - **Consumer-driven contract testing** (Pact): consumers define what fields they need; provider verifies it doesn't break contracts before deploying
  - **Header versioning**: `Accept: application/vnd.myapp.v2+json`
- Define a **deprecation policy**: v1 is supported for 6 months after v2 launch; consumers get notified

**Critical follow-up:** You have 20 downstream consumers and no contract tests. How do you safely find out which ones use `status` before you remove it? (API traffic analysis, access logs, or proactively reach out — this is a governance and process problem, not just a tech one.)

**Concepts:** API versioning, breaking changes, contract testing (Pact), backward compatibility, deprecation policy

---

## Scoring Rubric

| Score | Behaviour |
|-------|-----------|
| ⭐ | Names the concept ("use a circuit breaker") with no explanation |
| ⭐⭐ | Explains what the concept does and why it applies |
| ⭐⭐⭐ | Explains trade-offs, failure modes, and what the approach does NOT solve |
| ⭐⭐⭐⭐ | Designs a complete solution, anticipates follow-on problems, references real tools/patterns |

---

## Concept Coverage Quick Reference

| #  | Topic               | Pattern / Concept                                     |
|:---|:--------------------|:------------------------------------------------------|
| 1  | God service split   | DDD, bounded contexts, strangler fig                  |
| 2  | Shared DB           | DB-per-service, data ownership, events                |
| 3  | Nanoservices        | Service granularity, business capability              |
| 4  | Sync chain          | Cascading failure, circuit breaker, bulkhead          |
| 5  | Duplicate events    | At-least-once, idempotency, outbox                    |
| 6  | Saga / compensation | Saga pattern, orchestration vs choreography           |
| 7  | CQRS cost           | CQRS, eventual consistency, read-your-writes          |
| 8  | Dual write          | Outbox pattern, CDC, Debezium                         |
| 9  | No correlation      | Distributed tracing, OpenTelemetry, correlation IDs   |
| 10 | Config blast radius | Config management, progressive delivery, blast radius |
| 11 | JWT / service mesh  | Zero trust, mTLS, OAuth2, defence in depth            |
| 12 | API breaking change | Versioning, contract testing (Pact), deprecation      |

---

*Pro tip: Q4 → Q6 → Q5 in sequence is brutal for senior candidates — async communication, then saga failures, then event delivery guarantees. Very few nail all three.*


