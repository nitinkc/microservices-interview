# Design Patterns Interview Questions — Java 21+ Anti-Cheat Edition
> Each question uses **modern Java 21+ features** (records, sealed classes, pattern matching, switch expressions, virtual threads) woven into classic GoF patterns. The goal: verify the candidate understands *both* the pattern *and* the new Java idioms — not just one.

---

## Ground Rules for the Interviewer

- Ask: **"What pattern is this, and what problem does it solve?"** before anything else.
- Then: **"How does the Java 21 feature here change the traditional implementation?"**
- Watch for: candidates who know the GoF pattern but not the Java 21 nuance — or vice versa.
- Follow-ups probe **when NOT to use** the pattern — this separates real experience from book knowledge.

---

## SECTION A — Creational Patterns

---

### Q1. Singleton — Is This Thread-Safe? (Modern Java Trap)

```java
public class ConfigManager {

    private static ConfigManager instance;

    private final Map<String, String> config;

    private ConfigManager() {
        this.config = loadConfig();
    }

    public static ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager();  // ← is this safe?
        }
        return instance;
    }

    private Map<String, String> loadConfig() {
        return Map.of("timeout", "30", "retries", "3"); // immutable
    }
}
```

**Question 1:** Is this thread-safe? What can go wrong?

**Question 2:** Java 21 introduced **Virtual Threads** (Project Loom). Does that change the risk?

**What happens:**

- Classic race condition — two threads can both see `instance == null` and create two instances.
- **Virtual Threads** make this *worse*, not better: they are cheap (millions possible), so concurrent access is far more likely than with platform threads.
- Traditional fix: double-checked locking with `volatile`. But the **modern Java idiom** is the **initialization-on-demand holder**:

```java
public class ConfigManager {
    private ConfigManager() { }

    private static final class Holder {
        static final ConfigManager INSTANCE = new ConfigManager();
    }

    public static ConfigManager getInstance() {
        return Holder.INSTANCE;
    }
}
```

- Even better for config: use a **`record`** with a single instance via `enum` singleton:

```java
public enum ConfigManager {
    INSTANCE;
    private final Map<String, String> config = Map.of("timeout", "30");
    public String get(String key) { return config.get(key); }
}
```

**Follow-up:** Josh Bloch (Effective Java) recommends `enum` singleton. Why? What does it handle that double-checked locking doesn't? (Serialisation safety, reflection attacks.)

**Follow-up 2:** With Virtual Threads, when is Singleton *itself* an anti-pattern? (Shared mutable state becomes a concurrency bottleneck when thousands of virtual threads contend on it.)

**Concepts:** Singleton, thread safety, `volatile`, holder pattern, `enum` singleton, Virtual Threads (Loom)

---

### Q2. Builder Pattern — Records vs Traditional Builder

```java
// Traditional Builder
public class Order {
    private final String customerId;
    private final List<String> items;
    private final String status;

    private Order(Builder b) {
        this.customerId = b.customerId;
        this.items = List.copyOf(b.items);
        this.status = b.status;
    }

    public static class Builder {
        private String customerId;
        private List<String> items = new ArrayList<>();
        private String status = "PENDING";

        public Builder customerId(String id) { this.customerId = id; return this; }
        public Builder items(List<String> items) { this.items = items; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Order build() { return new Order(this); }
    }
}

// Java 16+ Record
public record OrderRecord(String customerId, List<String> items, String status) {
    public OrderRecord {
        Objects.requireNonNull(customerId, "customerId required");
        items = List.copyOf(items); // defensive copy in compact constructor
    }
}
```

**Question:** A junior dev says "just use a record — it's less code." When is the traditional Builder still the right choice over a record?

**What a weak answer looks like:**

- "Use records always, they're modern"
- "Use Builder always, it's a design pattern"

**What a strong answer looks like:**

- **Records are ideal** when: all fields are required, object is truly immutable, it's primarily a data carrier (DTO, value object)
- **Builder is still needed** when:
  - Many **optional fields** — record constructors require all fields
  - **Validation logic** is complex and staged
  - Object construction involves **multiple steps** or conditional logic
  - You need a **fluent API** for readability with 10+ parameters
  - The object is **mutable after construction** (records are always immutable)
- Records can use a compact constructor for validation but can't do step-by-step building

**Follow-up:** How would you add a Builder *to* a record for optional fields? (Create a separate `Builder` class that constructs the record in `build()`.)

**Follow-up 2:** What does `List.copyOf()` in the compact constructor buy you — and what does it break? (Immutability guarantee; breaks if caller passes a `null` list — needs null check first.)

**Concepts:** Builder pattern, records (Java 16+), compact constructors, immutability, defensive copying

---

### Q3. Factory Method — Sealed Classes + Pattern Matching

```java
public sealed interface Shape permits Circle, Rectangle, Triangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double base, double height) implements Shape {}

public class AreaCalculator {

    public static double area(Shape shape) {
        return switch (shape) {
            case Circle c    -> Math.PI * c.radius() * c.radius();
            case Rectangle r -> r.width() * r.height();
            case Triangle t  -> 0.5 * t.base() * t.height();
        };
    }
}
```

**Question 1:** This uses `sealed interface` + pattern matching `switch`. What design pattern does this implement, and how does `sealed` change the contract?

**Question 2:** A new `Hexagon` shape is added. What happens to this code — and why is that a feature, not a bug?

**What a strong answer looks like:**

- This is the **Visitor pattern** intent (dispatch behaviour by type) but implemented via **pattern matching switch** — no `accept()`/`visit()` boilerplate needed
- `sealed` means the compiler knows the **exhaustive set of subtypes** at compile time
- Adding `Hexagon` without updating the switch → **compile error** (non-exhaustive switch) — the compiler forces you to handle every case
- This is the key benefit: **closed type hierarchy** = **exhaustiveness checking** = fewer runtime surprises
- Traditional GoF Visitor requires adding `visit(Hexagon h)` to the `Visitor` interface AND every implementation — sealed + switch is far less ceremony

**Follow-up:** When would you use `sealed` + switch vs a traditional `Visitor`? (Sealed works when the type hierarchy is closed and stable; Visitor is better when types are stable but operations vary frequently.)

**Follow-up 2:** What happens if you add a `default` branch to the switch? (You lose exhaustiveness checking — the compiler won't warn you when a new subtype is added. Never add `default` to a sealed switch unless intentional.)

**Concepts:** Sealed classes (Java 17+), pattern matching switch (Java 21), Visitor pattern, exhaustiveness, records

---

## SECTION B — Structural Patterns

---

### Q4. Decorator — Where Does the Record Break Down?

```java
public interface Logger {
    void log(String message);
}

public record ConsoleLogger() implements Logger {
    public void log(String message) {
        System.out.println(message);
    }
}

public record TimestampLogger(Logger delegate) implements Logger {
    public void log(String message) {
        delegate.log("[" + Instant.now() + "] " + message);
    }
}

public record MaskingLogger(Logger delegate) implements Logger {
    public void log(String message) {
        delegate.log(message.replaceAll("\\d{4}-\\d{4}-\\d{4}-\\d{4}", "****-****-****-****"));
    }
}

// Usage:
Logger logger = new MaskingLogger(new TimestampLogger(new ConsoleLogger()));
logger.log("Card: 1234-5678-9012-3456");
```

**Question 1:** What pattern is this? What is the output?

**Question 2:** A teammate says "records are immutable data carriers — using them here as decorators feels wrong." Do you agree?

**Output:**
```
[2024-...] Card: ****-****-****-****
```
(Timestamp added, card number masked.)

**What a strong answer looks like:**

- This is the **Decorator pattern** — wraps behaviour at runtime without subclassing
- Using records *works* here because: each decorator is stateless except for the delegate, and `delegate` is effectively final in a record
- The teammate has a point: records are semantically meant to be **value objects / data carriers** — their `equals()`, `hashCode()`, and `toString()` are auto-generated based on components, which is semantically odd for a logger decorator
- Two `TimestampLogger(sameDelegate)` would be `equal` — is that correct? It depends on intent
- Better fit: records for decorators that *are* value objects (immutable transformations); plain classes for decorators with identity or mutable state

**Follow-up:** What is the difference between **Decorator** and **Proxy** patterns? (Decorator adds behaviour; Proxy controls access — same structure, different intent.)

**Follow-up 2:** How does this differ from using `Function.andThen()` for composing logger behaviour in Java?

**Concepts:** Decorator pattern, records as value objects, Proxy pattern, composition

---

### Q5. Adapter — Legacy Code + Modern Records

```java
// Legacy third-party class (cannot modify)
public class LegacyCustomer {
    public String getFirstName() { return "John"; }
    public String getLastName()  { return "Doe"; }
    public String getEmailAddress() { return "john@example.com"; }
}

// Modern system expects this contract
public interface Customer {
    String fullName();
    String email();
}

// Java 21 adapter using record
public record CustomerAdapter(LegacyCustomer legacy) implements Customer {
    public String fullName() {
        return legacy.getFirstName() + " " + legacy.getLastName();
    }
    public String email() {
        return legacy.getEmailAddress();
    }
}
```

**Question:** What pattern is this? What does making the adapter a `record` give you — and what does it prevent?

**What a strong answer looks like:**

- Classic **Adapter (Wrapper) pattern** — translates one interface to another without modifying the original
- Making it a `record` gives:
  - **Immutability**: the `legacy` reference can't be reassigned
  - **Auto `equals`/`hashCode`**: two adapters wrapping the same `LegacyCustomer` are considered equal
  - **Compact syntax**: no boilerplate constructor
- What it prevents / what to watch for:
  - Records **cannot be extended** — if you need `PremiumCustomerAdapter extends CustomerAdapter`, you can't
  - The auto-generated `toString()` exposes `legacy` — may leak implementation details or cause verbose output
  - Records implement `Serializable` implicitly — if `LegacyCustomer` isn't serializable, this could be a problem

**Follow-up:** When would you use `Object Adapter` (composition, like above) vs `Class Adapter` (inheritance)? Java doesn't support multiple inheritance of classes — so class adapter via `extends` is limited. Which is preferred and why?

**Concepts:** Adapter pattern, records limitations, composition over inheritance, legacy integration

---

### Q6. Facade — Hiding Complexity, But Can You Go Too Far?

```java
public class OrderFacade {

    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notification;
    private final AuditService audit;
    private final RewardService rewards;
    private final FraudDetectionService fraud;

    public OrderFacade(/* all 7 deps */) { ... }

    public OrderResult placeOrder(OrderRequest request) {
        fraud.check(request);
        inventory.reserve(request.items());
        payment.charge(request.payment());
        shipping.schedule(request);
        notification.sendConfirmation(request.customerId());
        audit.log(request);
        rewards.credit(request.customerId());
        return new OrderResult("SUCCESS");
    }
}
```

**Question 1:** This is a Facade pattern. What problem is it solving well?

**Question 2:** What has gone wrong here — and what pattern has it turned into?

**What a strong answer looks like:**

- **Facade** simplifies a complex subsystem behind a single entry point — good intent
- **What's gone wrong**: 7 dependencies, all sequential, no error handling, no rollback — this has become a **God Object / God Method**
- Specific problems:
  - If `payment.charge()` succeeds but `shipping.schedule()` throws → inventory reserved, money taken, no shipment
  - No transactional semantics (should be a Saga — see microservices questions)
  - Adding an 8th step means modifying this class — violates **Open/Closed Principle**
  - All 7 steps always run — what about a digital-only order that needs no shipping?
- Better design: Facade orchestrates a **pipeline** or **Chain of Responsibility**, not a hardcoded sequence

**Follow-up:** How would you refactor this using Java 21 to make it extensible? (Chain of Responsibility with `List<OrderStep>` functional interfaces, or a pipeline pattern using `Function.andThen()`.)

**Concepts:** Facade pattern, God Object anti-pattern, Open/Closed Principle, Chain of Responsibility

---

## SECTION C — Behavioural Patterns

---

### Q7. Strategy — Lambdas Killed the Strategy Class (Or Did They?)

```java
// Traditional Strategy
public interface SortStrategy {
    void sort(List<Integer> data);
}
public class BubbleSort implements SortStrategy {
    public void sort(List<Integer> data) { /* ... */ }
}
public class QuickSort implements SortStrategy {
    public void sort(List<Integer> data) { /* ... */ }
}

// Modern Java — Strategy as lambda
public class Sorter {
    private final Consumer<List<Integer>> strategy;

    public Sorter(Consumer<List<Integer>> strategy) {
        this.strategy = strategy;
    }
    public void sort(List<Integer> data) { strategy.accept(data); }
}

// Usage
Sorter s = new Sorter(data -> Collections.sort(data));
```

**Question:** A senior dev says "lambdas make the Strategy pattern obsolete in Java." Do you agree? When do you still want full Strategy classes?

**What a weak answer looks like:**

- "Yes, always use lambdas" or "No, always use classes"

**What a strong answer looks like:**

- Lambdas **are** the Strategy pattern when the strategy has a single method — `@FunctionalInterface` is literally a strategy contract
- **Lambdas are sufficient when:**
  - Strategy is stateless
  - Logic is short (a few lines)
  - No need to unit test the strategy in isolation
  - No need to name/describe the strategy (logging, metrics)
- **Full Strategy classes are still better when:**
  - Strategy has **state** (e.g., caches, thresholds, configuration)
  - Strategy needs **dependency injection** (e.g., calls a repository)
  - Strategy needs to be **named and registered** in a map for runtime selection
  - Strategy needs its own **unit tests**
  - Multiple methods in the contract (not a `@FunctionalInterface`)

**Follow-up:** How would you implement a **runtime-selectable strategy** from a config value `sort.algorithm=quicksort`? (Map of strategy name → lambda/instance, looked up at runtime — this is **Strategy + Registry** pattern.)

**Concepts:** Strategy pattern, lambdas as strategies, `@FunctionalInterface`, stateful vs stateless strategies

---

### Q8. Observer — Traditional vs `Flow` API (Java 9+)

```java
// Traditional Observer
public interface StockObserver {
    void onPriceChange(String ticker, double newPrice);
}

public class StockMarket {
    private final List<StockObserver> observers = new ArrayList<>();
    public void subscribe(StockObserver o) { observers.add(o); }
    public void priceChanged(String ticker, double price) {
        observers.forEach(o -> o.onPriceChange(ticker, price));
    }
}

// Java 9+ Reactive Observer via Flow API
public class StockPublisher implements Flow.Publisher<StockPrice> {
    public void subscribe(Flow.Subscriber<? super StockPrice> subscriber) {
        // SubmissionPublisher or custom subscription
    }
}
```

**Question 1:** What are the problems with the traditional observer approach at scale?

**Question 2:** How does `java.util.concurrent.Flow` (Java 9+) address them — and what is the core concept it adds?

**What a strong answer looks like:**

- **Traditional observer problems:**
  - Observers run **synchronously** on the publisher's thread — a slow observer blocks all others
  - No **backpressure**: if publisher emits faster than observer can consume → memory blowup or data loss
  - No **error propagation**: exceptions in one observer can break the chain
  - Memory leaks from observers not being unsubscribed
- **`Flow` API (Reactive Streams)** adds:
  - **Backpressure via `request(n)`**: subscriber controls how many items it's ready to receive
  - **Async processing**: publisher and subscriber run on different threads
  - **Lifecycle management**: `onSubscribe`, `onNext`, `onError`, `onComplete`
  - **Non-blocking**: fits naturally with Virtual Threads (Java 21)
- Key concept: **Reactive Streams protocol** — the subscriber pulls, not the publisher pushing blindly

**Follow-up:** `Flow` API is low-level. In production, what library would you use on top of it — and why? (Project Reactor / RxJava for operators like `map`, `filter`, `flatMap`, `debounce`.)

**Concepts:** Observer pattern, Reactive Streams, backpressure, `java.util.concurrent.Flow`, Virtual Threads

---

### Q9. Command Pattern — With Records and `sealed` for Undo

```java
public sealed interface OrderCommand permits PlaceOrder, CancelOrder, UpdateQuantity {}
public record PlaceOrder(String customerId, List<String> items) implements OrderCommand {}
public record CancelOrder(String orderId, String reason) implements OrderCommand {}
public record UpdateQuantity(String orderId, String itemId, int newQty) implements OrderCommand {}

public class OrderCommandHandler {
    private final Deque<OrderCommand> history = new ArrayDeque<>();

    public void execute(OrderCommand cmd) {
        switch (cmd) {
            case PlaceOrder p    -> doPlace(p);
            case CancelOrder c   -> doCancel(c);
            case UpdateQuantity u -> doUpdate(u);
        }
        history.push(cmd);
    }

    public void undo() {
        if (!history.isEmpty()) {
            OrderCommand last = history.pop();
            switch (last) {
                case PlaceOrder p    -> doCancel(new CancelOrder(/* id */ null, "undo"));
                case CancelOrder c   -> doPlace(/* restore */ null);
                case UpdateQuantity u -> doUpdate(/* previous qty */ null);
            }
        }
    }
}
```

**Question 1:** What pattern is this? What does `sealed` add that a plain `interface` wouldn't?

**Question 2:** There's a significant flaw in the `undo()` method. What is it?

**What a strong answer looks like:**

- **Command pattern**: encapsulates a request as an object — supports undo, queuing, logging
- `sealed` ensures exhaustive switch — adding a new command type forces updating both `execute()` and `undo()` at compile time — critical for correctness
- Records make commands **immutable value objects** — no risk of a command being mutated after queuing
- **The flaw in `undo()`**: the undo uses `null` placeholders — there's no stored **previous state**
  - `PlaceOrder` undo needs the generated `orderId` that was created *during* execution — but records are immutable, so it wasn't stored
  - `CancelOrder` undo needs a snapshot of the order *before* cancellation
  - Fix: commands should store both the **forward action** and the **compensating data**, or use a separate **memento** to capture state snapshots

**Follow-up:** How would you combine **Command + Memento** to implement a robust undo? (Command captures intent; Memento captures state snapshot before execution; undo restores memento.)

**Concepts:** Command pattern, sealed interfaces, records as value objects, Memento pattern, undo/redo

---

### Q10. Template Method — Default Methods vs Abstract Classes

```java
// Traditional Template Method
public abstract class DataProcessor {
    public final void process() { // final = template
        readData();
        processData();   // abstract — subclass fills in
        writeData();
    }
    protected abstract void processData();
    protected void readData()  { System.out.println("Reading..."); }
    protected void writeData() { System.out.println("Writing..."); }
}

// Java 8+ version with default methods
public interface DataProcessor {
    default void process() {
        readData();
        processData();
        writeData();
    }
    void processData(); // abstract — implementor fills in
    default void readData()  { System.out.println("Reading..."); }
    default void writeData() { System.out.println("Writing..."); }
}
```

**Question:** Both implement Template Method. What is the key difference between using an `abstract class` vs an `interface with default methods` — and when does each win?

**What a strong answer looks like:**

- **Abstract class wins when:**
  - You need to share **state** (fields) across steps — interfaces can't have instance fields
  - You need `protected` visibility — interface members are `public` by default
  - You want to **prevent** subclasses from calling steps out of order (`final` template method is enforceable)
  - Steps need access to constructor-injected dependencies
- **Interface with default methods wins when:**
  - The implementing class needs to **extend another class** (Java's single inheritance limit)
  - The processor is a **mixin** behaviour — not the primary identity of the class
  - You want the implementing class to compose multiple behaviours
- **The `final` trap**: you cannot make a `default` method `final` in an interface — so the template can be overridden by implementors, breaking the pattern's guarantee

**Follow-up:** In Java 21, how do **virtual threads** interact with a Template Method that has blocking I/O in `readData()`? (Virtual threads make the blocking cheap — each `process()` call can run in its own virtual thread without OS thread overhead, enabling high concurrency without reactive plumbing.)

**Concepts:** Template Method, abstract class vs interface default methods, `final`, virtual threads, single inheritance

---

## SECTION D — Modern Java 21 Patterns

---

### Q11. Pattern Matching + Switch — The Type-Safe Visitor Without Boilerplate

```java
public sealed interface Notification
    permits EmailNotification, SmsNotification, PushNotification {}

public record EmailNotification(String to, String subject, String body) implements Notification {}
public record SmsNotification(String phoneNumber, String text) implements Notification {}
public record PushNotification(String deviceToken, String title, String payload) implements Notification {}

public class NotificationDispatcher {

    public String dispatch(Notification n) {
        return switch (n) {
            case EmailNotification e when e.body().length() > 1000
                                     -> sendChunked(e);
            case EmailNotification e -> sendEmail(e);
            case SmsNotification s when s.text().length() > 160
                                     -> "SMS too long: " + s.text().length() + " chars";
            case SmsNotification s   -> sendSms(s);
            case PushNotification p  -> sendPush(p);
        };
    }
}
```

**Question 1:** What does the `when` clause do here — and what is it called in Java?

**Question 2:** Why is the order of the `case` branches important for `EmailNotification`?

**What a strong answer looks like:**

- `when` is a **guard clause** (Java 21, also called a guarded pattern) — adds a boolean condition on top of the type match
- Order matters: `case EmailNotification e when e.body().length() > 1000` must come **before** `case EmailNotification e` — if the general case came first, the guarded case would be **dominated** (unreachable) → compile error
- This is the **Visitor pattern** completely replaced: no `accept()`, no `visit()`, no double dispatch boilerplate — just a `switch` expression
- `sealed` guarantees exhaustiveness — the compiler enforces all types are handled

**Follow-up:** What happens at runtime if a `null` is passed to `dispatch()`? (Java 21 switch does NOT match `null` by default — throws `NullPointerException`. You can add `case null -> ...` explicitly.)

**Follow-up 2:** How is this different from `instanceof` chains with `else if`? (Switch expression is exhaustive and checked by the compiler; `instanceof` chains are not — you can silently miss a type.)

**Concepts:** Sealed classes, pattern matching switch (Java 21), guarded patterns (`when`), Visitor replacement, null handling

---

### Q12. Virtual Threads (Project Loom) — What Changes for Design Patterns?

```java
// Before Java 21 — thread pool needed to limit resource usage
ExecutorService pool = Executors.newFixedThreadPool(200);
for (Order order : orders) {
    pool.submit(() -> processOrder(order)); // blocking I/O inside
}

// Java 21 — Virtual Threads
ExecutorService vExecutor = Executors.newVirtualThreadPerTaskExecutor();
for (Order order : orders) {
    vExecutor.submit(() -> processOrder(order)); // same code, different behaviour
}
```

```java
// processOrder does blocking I/O:
void processOrder(Order order) {
    Result r = httpClient.send(request, BodyHandlers.ofString()); // blocks
    db.save(r);                                                    // blocks
}
```

**Question 1:** What is the fundamental difference between platform threads and virtual threads, and why does it matter for the code above?

**Question 2:** Does this mean you should always use `newVirtualThreadPerTaskExecutor`? What patterns or code break with virtual threads?

**What a strong answer looks like:**

- **Platform threads** map 1:1 to OS threads — blocking I/O parks the OS thread, wasting ~1MB of stack
- **Virtual threads** are JVM-managed — blocking I/O parks the virtual thread but **unmounts it from the carrier OS thread**, which is then free to run other virtual threads
- Result: you can have **millions** of virtual threads with the same OS threads — no thread pool needed for I/O-bound work
- **What breaks or needs rethinking:**
  - **Synchronized blocks with I/O inside** (thread pinning): `synchronized` blocks pin the virtual thread to its carrier — defeats the benefit. Replace with `ReentrantLock`
  - **Thread locals for connection pooling**: if you create a DB connection per thread, millions of virtual threads = millions of connections — still need a connection pool
  - **Thread pool sizing heuristics** are obsolete for I/O-bound work: `nThreads = nCores * 2` was for platform threads; virtual threads change the equation entirely
  - **CPU-bound work**: virtual threads give no benefit — a `ForkJoinPool` with platform threads is still correct
  - **Singleton + mutable state** becomes a bigger bottleneck — contention increases dramatically

**Follow-up:** Your team uses `ThreadLocal` to store the current user's security context (Spring Security does this). Does that work with virtual threads? (Yes, but thread locals are created per virtual thread — if you create millions, the memory adds up. Java 21 introduces `ScopedValue` as the replacement.)

**Concepts:** Virtual Threads (Project Loom), thread pinning, `synchronized` vs `ReentrantLock`, `ThreadLocal` vs `ScopedValue`, connection pooling, CPU vs I/O bound

---

## Bonus — Design Smell Rapid Fire

> Give these one at a time. Candidate has 60 seconds per answer. Tests breadth quickly.

| Smell | Question |
|-------|----------|
| **Switch on type** | You see `if (obj instanceof Dog) ... else if (obj instanceof Cat)` in 5 places. What pattern fixes this — and what Java 21 feature makes it cleaner? |
| **Constructor explosion** | A class has 8 constructors with different combinations of optional parameters. What pattern fixes this? |
| **Behaviour hardcoded in `if/else`** | A `PricingEngine` has `if (customer.type == PREMIUM) ... else if (customer.type == VIP) ...`. New types keep being added, requiring code changes. Pattern? |
| **Tight coupling to implementation** | `OrderService` directly instantiates `MySQLOrderRepository`. What pattern decouples it — and how do Spring and Java interfaces implement this? |
| **Repeated cross-cutting code** | Logging, timing, and auth checks are copy-pasted at the start of 30 service methods. Pattern? Java mechanism? |
| **Object state transitions** | An `Order` goes through: PENDING → CONFIRMED → SHIPPED → DELIVERED → RETURNED. Logic for what's allowed in each state is scattered in `if` blocks. Pattern? |

**Expected Answers:**
1. Visitor / sealed + pattern matching switch
2. Builder pattern
3. Strategy pattern
4. Repository pattern / Dependency Injection
5. Decorator / AOP (Aspect-Oriented Programming)
6. State pattern

---

## Scoring Rubric

| Score | Behaviour |
|-------|-----------|
| ⭐ | Names the pattern correctly |
| ⭐⭐ | Explains what problem it solves and the basic structure |
| ⭐⭐⭐ | Connects the Java 21 feature to the pattern; explains trade-offs |
| ⭐⭐⭐⭐ | Knows when NOT to use the pattern; identifies the subtle flaw or trap; relates to real production experience |

---

## Concept Coverage Quick Reference

| # | Pattern | Java 21 Feature |
|---|---------|----------------|
| 1 | Singleton | Virtual Threads risk, enum singleton |
| 2 | Builder | Records, compact constructors |
| 3 | Factory / Visitor | Sealed classes, pattern matching switch |
| 4 | Decorator | Records as value objects |
| 5 | Adapter | Records limitations, composition |
| 6 | Facade → God Object | Open/Closed, Chain of Responsibility |
| 7 | Strategy | Lambdas, `@FunctionalInterface` |
| 8 | Observer | `java.util.concurrent.Flow`, backpressure |
| 9 | Command + Memento | Sealed + records for undo |
| 10 | Template Method | Default methods vs abstract class |
| 11 | Visitor replacement | Guarded patterns (`when`), sealed switch |
| 12 | (Meta) Loom impact | Virtual Threads, `ScopedValue`, pinning |
| Bonus | 6 smells rapid-fire | Breadth check |

---

*Pro tip: Q3 → Q11 → Q9 in sequence covers sealed classes three ways — factory dispatch, visitor replacement, and command undo. A candidate who truly understands sealed types will connect all three without prompting.*


