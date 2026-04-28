*[API]: Application Programming Interface
*[gRPC]: Google Remote Procedure Call — high-performance RPC framework using Protocol Buffers
*[REST]: Representational State Transfer — architectural style for distributed systems
*[HTTP]: HyperText Transfer Protocol
*[SLA]: Service Level Agreement — guaranteed availability and performance
*[SLO]: Service Level Objective — target for SLA
*[SLI]: Service Level Indicator — measurement of SLO
*[RTO]: Recovery Time Objective — maximum acceptable downtime
*[RPO]: Recovery Point Objective — maximum acceptable data loss
*[TTL]: Time To Live — expiry duration for cached entries
*[RCA]: Root Cause Analysis
*[APM]: Application Performance Monitoring
*[Saga]: Distributed transaction pattern using compensating transactions
*[2PC]: Two-Phase Commit — distributed atomic commit protocol
*[CDC]: Change Data Capture — streaming database changes to downstream consumers
*[ACID]: Atomicity, Consistency, Isolation, Durability — transactional guarantees
*[BASE]: Basically Available, Soft state, Eventually consistent — eventual consistency model
*[CAP]: Consistency, Availability, Partition Tolerance — only two guaranteed in distributed systems
*[CQRS]: Command Query Responsibility Segregation — separate read and write models
*[Event Sourcing]: Architecture pattern storing all state changes as immutable events
*[Idempotency]: Property where repeated operations produce same result as single operation
*[Circuit Breaker]: Resilience pattern that stops requests to failing services
*[Bulkhead]: Resilience pattern that isolates resources per service
*[Fallback]: Graceful degradation when primary operation fails
*[Load Balancing]: Distributing traffic across multiple instances
*[Auto-scaling]: Automatically adjusting number of instances based on load
*[Canary Deployment]: Gradual rollout to small percentage of traffic before full release
*[Blue-Green Deployment]: Switching between two identical production environments
*[Feature Flag]: Runtime configuration to enable/disable features without deployment
*[Distributed Tracing]: Tracking requests across multiple services
*[Logging]: Recording events and errors for debugging and analysis
*[Metrics]: Quantitative measurements of system behavior
*[Monitoring]: Continuous observation of system health
*[Alerting]: Automated notifications when metrics exceed thresholds
*[Database Replication]: Copying data across multiple database instances
*[Read Replica]: Copy of primary database serving read-only traffic
*[Message Queue]: Asynchronous communication channel for decoupled services
*[Event Stream]: Ordered sequence of events (e.g., Kafka topics)
*[Orchestration]: Central coordinator managing service interactions
*[Choreography]: Services react to events from other services
*[Timeout]: Maximum time to wait for response before failing
*[Retry]: Automatic reattempt of failed operation
*[Backoff]: Exponential increase in wait time between retries
*[Graceful Degradation]: System continues operating with reduced functionality under load
*[Rate Limiting]: Restricting number of requests per time period
*[Caching]: Storing frequently accessed data for faster retrieval
*[Cache Invalidation]: Process of removing stale cached data
*[Connection Pool]: Reusable set of database connections
*[Thread Pool]: Reusable set of threads for handling concurrent operations
*[Protocol Buffers]: Efficient method of serializing structured data (Google)
*[JSON]: JavaScript Object Notation — text-based data format
*[Latency]: Time delay from request to response
*[Throughput]: Number of requests processed per unit time
*[Availability]: Percentage of time system is operational
*[Consistency]: All nodes have same view of data at same time
*[Eventual Consistency]: Consistency model where replicas converge over time
*[Domain-Driven Design]: Design approach centered around business domains
*[Bounded Context]: Explicit boundary around a domain model
*[Microservice]: Small, independent service focused on specific business capability
*[Monolith]: Single, tightly-coupled application
*[API Gateway]: Entry point for client requests to microservices
*[Service Mesh]: Infrastructure layer managing service-to-service communication
*[Docker]: Container platform for packaging applications
*[Kubernetes]: Container orchestration platform
*[Deployment]: Release of code changes to production
*[Rollback]: Reverting to previous version after failed deployment
