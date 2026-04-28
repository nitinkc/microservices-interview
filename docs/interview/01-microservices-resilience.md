# Microservices & Spring Interview Questions

> **Level:** Intermediate to Advanced


---

## Resilience & Fault Tolerance

Managing failures and preventing cascading impacts across distributed systems.

??? question "One microservice becomes slow and starts impacting all dependent services. How will you prevent cascading failures?"
    Implement circuit breakers (e.g., Spring Cloud Circuit Breaker, Hystrix) to detect slow responses and fail fast. Use timeout policies, bulkheads to isolate thread pools per service, and rate limiting to prevent resource exhaustion. Add fallback mechanisms for critical reads. Monitor latency metrics and alert before cascading failures occur.

??? question "A service dependency introduces high latency. How will you design fallback mechanisms?"
    Implement graceful degradation by offering cached responses, stale data, or reduced functionality when the dependency is slow. Use async/non-blocking patterns where possible. Design fallbacks at the API Gateway level for common failures. Cache responses with TTLs. For non-critical data, return partial results. Always ensure fallbacks are tested and versioned alongside services.

??? question "A downstream service becomes unavailable frequently. How will you ensure resilience?"
    Use health checks and automatic failover to healthy instances. Implement retry logic with exponential backoff and jitter. Design idempotent endpoints to make retries safe. Use service mesh (e.g., Istio) for intelligent routing and traffic policies. Implement bulkheads to limit resources consumed by this service. Consider eventual consistency patterns and async messaging as alternatives to synchronous calls.

??? question "Your system needs to handle partial failures gracefully. How will you design it?"
    Use saga patterns (orchestration or choreography) to handle distributed transactions where some steps may fail. Implement compensating transactions to roll back partial changes. Design APIs to be partially successful — return which items succeeded/failed. Use eventual consistency where total consistency isn't critical. Log partial failures separately for replay/recovery.

??? question "A critical service must remain available even if dependencies fail. How will you design for high availability?"
    Design the service to work in degraded mode when dependencies fail. Use local caches or replica databases. Implement read-only fallbacks. Use multi-region deployment with failover. Design independent, loosely coupled services. Use asynchronous messaging that decouples producers from consumers. Implement automated recovery and health-driven routing.

---

## Service Communication & Reliability

Ensuring inter-service calls are reliable and properly handled.

??? question "Inter-service communication fails intermittently. How will you ensure reliability?"
    Use retry mechanisms with exponential backoff and jitter. Implement timeouts to prevent hanging requests. Use circuit breakers for failing services. Implement idempotency keys to safely retry requests. Use service mesh for resilient communication. Add comprehensive logging and distributed tracing. Monitor network latency and packet loss. Consider using message queues for non-real-time communication.

??? question "Inter-service communication causes network overhead. How will you optimize it?"
    Use efficient serialization formats (Protocol Buffers instead of JSON for internal APIs). Implement caching at gateway and service level. Use HTTP/2 for multiplexing. Batch requests where possible. Use async messaging for non-real-time requirements. Consider gRPC for high-performance inter-service communication. Implement connection pooling. Use CDNs for static content.

??? question "You observe duplicate requests due to retries. How will you ensure idempotency?"
    Implement idempotency keys (unique request IDs) at the client level. Design handler methods to be idempotent — reprocessing with the same input produces the same result. Use database unique constraints or conditional writes. Store idempotency keys with results for a window of time. Implement at-most-once processing semantics in message handlers. Use transaction IDs across distributed calls.

??? question "A downstream service returns incorrect data with a success status. How will you handle it?"
    Implement validation at the consumer level — never trust the response format or content. Use schema validation (OpenAPI, Protobuf schemas). Implement circuit breakers that detect data quality issues. Add canary deployments with validation checks. Implement data freshness checks. Use observability to detect anomalies in response patterns. Design compensating transactions to handle bad data.

---

## Performance & Scalability

Optimizing performance under load and identifying bottlenecks.

??? question "Your system shows high latency only during peak hours. How will you identify the bottleneck?"
    Use distributed tracing (e.g., Jaeger, Zipkin) to identify which service/component is slow. Analyze database query performance during peaks. Check CPU, memory, and network utilization. Look for lock contention or resource saturation. Monitor JVM garbage collection pauses. Analyze thread pool saturation. Use load testing to reproduce the issue. Check for cascading failures from slow dependency.

??? question "Your API Gateway becomes a bottleneck under load. How will you optimize it?"
    Implement horizontal scaling with load balancing. Use async processing in the gateway. Optimize routing logic and caching. Implement rate limiting to prevent overload. Use connection pooling. Cache responses at the gateway level. Consider splitting into multiple gateways by business domain. Use CDN for static content. Offload TLS termination to a load balancer. Monitor gateway metrics carefully.

??? question "You notice uneven load distribution across instances. What could be wrong?"
    Check the load balancer algorithm — ensure it's health-aware. Verify service instances have similar performance (no slow instances). Check if sticky sessions are misconfigured. Look for request affinity issues. Verify DNS round-robin is working. Check if some instances are under more load due to colocation. Implement least-connections or weighted round-robin balancing. Monitor instance metrics individually.

??? question "A sudden traffic spike crashes multiple services. How will you scale and stabilize the system?"
    Implement auto-scaling policies based on CPU, memory, or custom metrics. Use load shedding to gracefully degrade during spikes. Implement bulkheads to prevent cascading failures. Use rate limiting and quota management. Add more replicas horizontally. Scale database read replicas if applicable. Implement caching aggressively. Use message queues to buffer requests. Implement circuit breakers to prevent overload propagation.

---

## Data Consistency & Idempotency

Ensuring data consistency across distributed services.

??? question "Your system processes the same event multiple times. How will you prevent duplication?"
    Implement idempotent event handlers — process the same message multiple times safely. Use event deduplication with event IDs and a store of processed IDs. Implement exactly-once processing semantics in message brokers. Use database unique constraints. Track event sequence numbers. Implement idempotency keys at the handler level. Design handlers to be side-effect free on replay.

??? question "Your system needs to ensure data consistency across multiple services. What approach will you use?"
    Use eventual consistency with compensating transactions (saga pattern). Implement distributed transactions carefully (2-phase commit is rarely recommended). Use event sourcing to maintain audit trail. Design for conflict resolution. Implement version vectors or timestamps. Use message queues for reliable event delivery. Consider domain-driven design to reduce cross-service consistency requirements. Implement comprehensive monitoring to detect consistency issues.

??? question "A message queue builds up a backlog of unprocessed events. How will you handle it?"
    Increase consumer instances to process messages in parallel. Optimize consumer processing speed — profile and optimize handler code. Implement batching to process multiple messages together. Use priority queues for critical messages. Implement rate limiting on producers if sustainable. Archive old messages if acceptable. Use dead-letter queues for poison messages. Monitor queue depth and alert on buildup. Consider stream processing frameworks for complex logic.

---

## Observability & Debugging

Making distributed systems observable and debuggable.

??? question "Your logs are distributed across services making debugging difficult. How will you centralize logging?"
    Implement centralized logging (ELK Stack, Splunk, DataDog, etc.). Add structured logging with correlation IDs across all services. Include request IDs in logs automatically via middleware. Log at appropriate levels (INFO, WARN, ERROR). Add context information (service name, instance ID, user ID). Implement log aggregation pipelines. Use log sampling for high-volume services. Create dashboards for log analysis. Implement alerting on error patterns.

??? question "A service silently fails without proper logs. How will you improve observability?"
    Ensure all code paths log errors with full context. Implement exception handlers that capture stack traces. Use observability tools (metrics, traces, logs). Implement health checks and expose metrics. Add debug logging in development. Use APM tools (Application Performance Monitoring) to detect silent failures. Implement alerting on error rates and latency anomalies. Add circuit breaker monitoring. Implement canary deployments with validation.

??? question "You need to trace a request across multiple services. How will you implement distributed tracing?"
    Use a distributed tracing system (Jaeger, Zipkin, or vendor-managed like DataDog). Implement trace propagation by passing trace IDs and span IDs across service boundaries. Use Spring Cloud Sleuth for automatic instrumentation. Instrument HTTP calls, database queries, and message handling. Sample traces intelligently to avoid overhead. Create dashboards showing request flow. Analyze traces to identify slow operations.

---

## Deployment & Compatibility

Managing deployments and service versioning.

??? question "A deployment introduces version mismatch between services. How will you maintain compatibility?"
    Use semantic versioning for APIs. Implement API versioning (URL path, headers, or request body). Design APIs to be forward-compatible — ignore unknown fields. Implement deprecation cycles and communicate timelines. Use feature flags for gradual rollouts. Validate request/response schemas at runtime. Use contracts (Pact, Spring Cloud Contract) to test compatibility. Implement canary deployments. Support multiple API versions simultaneously.

??? question "A service works in staging but fails in production. How will you approach debugging?"
    Ensure staging environment mirrors production (data volume, configuration, dependencies). Check environment-specific configuration and secrets. Compare logs between staging and production. Use production debugging tools (sampling, profiling). Check for data-dependent issues. Verify third-party service availability in production. Check for timing-related issues (race conditions, timeouts). Use feature flags to isolate problematic features. Implement A/B testing for gradual rollouts.

---

## Advanced Patterns

Complex scenarios requiring sophisticated solutions.

??? question "Your API responses become inconsistent due to async processing. How will you handle it?"
    Design APIs to return task IDs for async operations and provide status endpoints. Implement eventual consistency patterns explicitly. Use event sourcing to maintain consistent state. Implement polling or webhooks for result notification. Cache responses with appropriate TTLs. Design APIs to clarify what is synchronous vs async. Implement idempotent result retrieval. Use state machines to track async operation state.

--8<-- "_abbreviations.md"
