# Spring Boot Interview Questions — Anti-Cheat Edition
> Each snippet is **real, runnable Spring Boot code** with a subtle behaviour, bug, or design trap. Ask the candidate to predict what happens *before* they run it. Follow-ups expose whether they truly understand Spring internals.

---

## Ground Rules for the Interviewer
- Always ask: **"What does this do / print / throw — and why?"** before any explanation.
- Follow up with **"How would you fix / improve this?"**
- Bonus: ask them to write a small variation from scratch (no copy-paste source).

---

## 1. `@Autowired` on a `final` Field — Does It Work?

```java
@Service
public class OrderService {

    @Autowired
    private final PaymentService paymentService;  // final + @Autowired

    public void process() {
        paymentService.charge();
    }
}
```

**Question:** Does this compile and start up? What is the recommended alternative?

**What happens:**
- It **compiles** but Spring **cannot inject** via field injection into a `final` field — the field stays `null` at runtime → `NullPointerException` on `process()`.
- The correct approach is **constructor injection**, which works naturally with `final`:

```java
@Service
public class OrderService {
    private final PaymentService paymentService;

    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

**Follow-up:** Why does Spring (and the community) strongly prefer constructor injection over field injection? (Testability, immutability, no reflection hacks, fails fast at startup.)

**Concepts:** Dependency injection, field vs constructor injection, `final` semantics

---

## 2. Circular Dependency — Will It Start?

```java
@Service
public class ServiceA {
    @Autowired
    private ServiceB serviceB;
}

@Service
public class ServiceB {
    @Autowired
    private ServiceA serviceA;
}
```

**Question:** Does the application context start? What error do you get?

**What happens:**
- With **field injection**, Spring *used to* resolve this silently via a proxy in older versions.
- Since **Spring Boot 2.6+**, circular dependencies are **prohibited by default** → `BeanCurrentlyInCreationException` at startup.
- With **constructor injection**, it always fails regardless of version (correctly).

**Fix options:**
1. Refactor to remove the cycle (best).
2. `@Lazy` on one of the injections.
3. `spring.main.allow-circular-references=true` (not recommended).

**Follow-up:** How would you detect circular dependencies early in a large codebase?

**Concepts:** Spring bean lifecycle, circular dependency, `@Lazy`, Spring Boot 2.6 change

---

## 3. `@Transactional` on a `private` Method

```java
@Service
public class InvoiceService {

    @Transactional
    private void saveInvoice(Invoice invoice) {
        repo.save(invoice);
    }

    public void createInvoice(Invoice invoice) {
        saveInvoice(invoice);
    }
}
```

**Question:** Is the `saveInvoice` method transactional? Why or why not?

**What happens:**
- `@Transactional` on a **`private` method is silently ignored** by Spring's AOP proxy.
- Spring creates a subclass proxy (CGLIB) that can only intercept `public` (or `protected`) methods.
- `createInvoice` calls `saveInvoice` via `this.saveInvoice()` (not through the proxy), so even if the method were public, the transaction would still not apply — this is the **self-invocation problem**.

**Fix:**
```java
@Transactional
public void saveInvoice(Invoice invoice) { ... } // make public
// AND call via the proxy, not self-invocation
```

**Follow-up:** How does CGLIB proxying work? What is the alternative (AspectJ weaving)?

**Concepts:** `@Transactional`, AOP proxy, CGLIB, self-invocation trap, proxy-based AOP limitations

---

## 4. `@Transactional` Propagation Trap

```java
@Service
public class UserService {

    @Autowired
    private AuditService auditService;

    @Transactional
    public void createUser(User user) {
        userRepo.save(user);
        auditService.log("created " + user.getName()); // throws RuntimeException
    }
}

@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String message) {
        auditRepo.save(new AuditLog(message));
        throw new RuntimeException("audit failed");
    }
}
```

**Question:** When `log()` throws, is the `userRepo.save()` rolled back too?

**What happens:**
- `REQUIRES_NEW` **suspends** the outer transaction and starts a fresh one.
- `auditService.log()` rolls back its **own** transaction (the new one).
- The exception **propagates** up to `createUser()`, which rolls back its transaction too.
- So **both** saves are rolled back — unless `createUser` catches the exception.

**Follow-up:** How would you make the audit log persist even if the outer transaction rolls back? (Catch the exception from `log()` and swallow it, or use an event/async mechanism.)

**Concepts:** Transaction propagation, `REQUIRES_NEW`, rollback semantics, exception propagation

---

## 5. `@RequestParam` vs `@PathVariable` — What Breaks?

```java
@RestController
@RequestMapping("/items")
public class ItemController {

    @GetMapping("/{id}")
    public String getById(@RequestParam Long id) {
        return "item-" + id;
    }
}
```

**Question:** You call `GET /items/42`. What happens?

**What happens:**
- `@RequestParam` reads from **query parameters** (`?id=42`), not the path.
- `GET /items/42` with `@RequestParam Long id` → `MissingServletRequestParameterException` (400 Bad Request).
- Fix: use `@PathVariable Long id`.

**Follow-up:** What is the difference between `@RequestParam(required = false)` and `Optional<Long> id`? How do you handle a missing path variable gracefully?

**Concepts:** `@PathVariable`, `@RequestParam`, request mapping, 400 vs 404 errors

---

## 6. `@Component` vs `@Bean` — Duplicate Registration

```java
@Component
public class EmailService {
    public EmailService() { System.out.println("EmailService created"); }
}

@Configuration
public class AppConfig {
    @Bean
    public EmailService emailService() {
        return new EmailService();
    }
}
```

**Question:** How many `EmailService` instances are created? Which one does Spring use?

**What happens:**
- Spring registers **two** bean definitions: one from component scan, one from `@Bean`.
- By default this causes a **`ConflictingBeanDefinitionException`** or one overrides the other depending on Spring Boot version and `spring.main.allow-bean-definition-overriding`.
- Spring Boot 2.1+ disallows overriding by default.

**Fix:** Choose one registration strategy — remove `@Component` or the `@Bean` method.

**Follow-up:** When would you use `@Bean` inside `@Configuration` instead of `@Component`? (Third-party classes you can't annotate, conditional beans, programmatic control.)

**Concepts:** Component scan vs `@Bean`, bean definition conflicts, `@Configuration`

---

## 7. Singleton Bean Holding a Prototype — Scope Trap

```java
@Component
@Scope("prototype")
public class RequestContext { /* stateful, per-request */ }

@Service  // singleton by default
public class ReportService {
    @Autowired
    private RequestContext context; // injected ONCE at startup

    public void generate() {
        // uses context — but it's always the SAME instance!
    }
}
```

**Question:** Will `RequestContext` really be a new instance per `generate()` call?

**What happens:**
- No. `@Autowired` injects the dependency **once** when the singleton is created.
- The same `RequestContext` prototype instance is reused for every call → stale/shared state.
- Fix options: inject `ApplicationContext` and call `getBean()` each time, use `@Lookup`, or use `ObjectProvider<RequestContext>`.

```java
@Autowired
private ObjectProvider<RequestContext> contextProvider;

public void generate() {
    RequestContext ctx = contextProvider.getObject(); // new instance each time
}
```

**Follow-up:** What are the five Spring bean scopes? When would you use `request` or `session` scope?

**Concepts:** Bean scopes, singleton vs prototype, `ObjectProvider`, `@Lookup`

---

## 8. `application.properties` vs `@Value` — What Happens When the Property Is Missing?

```java
@RestController
public class ConfigController {

    @Value("${app.timeout}")
    private int timeout;

    @GetMapping("/timeout")
    public int getTimeout() { return timeout; }
}
```

`application.properties` has **no** `app.timeout` entry.

**Question:** What happens at application startup?

**What happens:**
- Spring throws `BeanCreationException: Could not resolve placeholder 'app.timeout'` → **application fails to start**.
- Fix with a default: `@Value("${app.timeout:30}")` → uses `30` if missing.

**Follow-up:** What is the advantage of `@ConfigurationProperties` over `@Value` for a group of related properties? How do you validate them?

**Concepts:** `@Value`, property resolution, `@ConfigurationProperties`, fail-fast startup

---

## 9. `@MockBean` vs `@Mock` — Wrong Annotation in a Spring Test

```java
@SpringBootTest
class OrderServiceTest {

    @Mock                          // ← Mockito annotation, NOT Spring-aware
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService; // has @Autowired PaymentService inside

    @Test
    void testOrder() {
        when(paymentService.charge(any())).thenReturn(true);
        orderService.process(new Order());
    }
}
```

**Question:** Will `paymentService` inside `OrderService` be the mock? What is the bug?

**What happens:**
- `@Mock` creates a Mockito mock but **does not register it in the Spring context**.
- `OrderService` is a real Spring bean — its `paymentService` is the **real bean from the context**, not the mock.
- The `when(...)` stub has no effect on the real bean → test hits the real `PaymentService`.
- Fix: use `@MockBean` which replaces the bean in the Spring context.

**Follow-up:** When would you use `@WebMvcTest` instead of `@SpringBootTest`? What is the difference in startup cost?

**Concepts:** `@MockBean` vs `@Mock`, Spring test context, `@SpringBootTest`, test slices

---

## 10. `@RestController` Exception Handling — Unhandled Exception Response

```java
@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
```

**Question:** When the user is not found, what HTTP status code does the client receive? Is that correct REST behaviour?

**What happens:**
- An unhandled `RuntimeException` → Spring returns **500 Internal Server Error**.
- Semantically, "not found" should be **404**.
- Fix:

```java
// Custom exception
@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends RuntimeException { ... }

// OR global handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handle(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
```

**Follow-up:** What is `@ControllerAdvice` vs `@RestControllerAdvice`? What is `ProblemDetail` in Spring 6?

**Concepts:** Exception handling, `@ExceptionHandler`, `@RestControllerAdvice`, HTTP semantics

---

## 11. JPA `@OneToMany` — The N+1 Query Problem

```java
@Entity
public class Author {
    @Id Long id;
    String name;

    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    List<Book> books;
}

// In a service:
List<Author> authors = authorRepo.findAll();
for (Author a : authors) {
    System.out.println(a.getBooks().size()); // triggers extra query per author
}
```

**Question:** If there are 100 authors, how many SQL queries are executed?

**What happens:**
- `findAll()` → **1** query for authors.
- Each `a.getBooks()` → **1** query per author (lazy load triggered).
- Total: **101 queries** — the classic **N+1 problem**.

**Fix:** Use a JOIN FETCH query or `@EntityGraph`:
```java
@Query("SELECT a FROM Author a JOIN FETCH a.books")
List<Author> findAllWithBooks();
```

**Follow-up:** What is the difference between `EAGER` and `LAZY` fetching? Why is `EAGER` on `@OneToMany` dangerous?

**Concepts:** JPA lazy loading, N+1 problem, `JOIN FETCH`, `@EntityGraph`

---

## 12. `@Scheduled` — Will This Run in a Test?

```java
@Component
public class ReportScheduler {

    @Scheduled(fixedRate = 5000)
    public void generateReport() {
        System.out.println("Generating report...");
    }
}

@SpringBootTest
class ReportSchedulerTest {
    @Test
    void contextLoads() { }
}
```

**Question:** Will `generateReport()` be called during the test? Could this cause flaky tests?

**What happens:**
- Yes — `@SpringBootTest` loads the full context including scheduling infrastructure (`@EnableScheduling`).
- The scheduler **fires during the test** → potential side effects, flaky timing-based failures.
- Fix: disable scheduling in tests:

```java
@SpringBootTest
@MockBean(ReportScheduler.class) // replace with mock
// OR
@TestPropertySource(properties = "spring.task.scheduling.pool.size=0")
// OR move to a separate config with @ConditionalOnProperty
```

**Follow-up:** How do you test `@Scheduled` methods in isolation? What is `@DisabledIfSystemProperty`?

**Concepts:** `@Scheduled`, `@EnableScheduling`, test isolation, `@MockBean`

---

## Quick Reference: Concepts Coverage

| # | Topic | Key Concept |
|---|-------|-------------|
| 1 | `@Autowired final` field | Constructor injection, DI best practice |
| 2 | Circular dependency | Bean lifecycle, Spring Boot 2.6+ change |
| 3 | `@Transactional` private / self-invoke | AOP proxy, CGLIB, self-invocation |
| 4 | `REQUIRES_NEW` propagation | Transaction scopes, rollback semantics |
| 5 | `@RequestParam` vs `@PathVariable` | Request mapping, 400 errors |
| 6 | `@Component` + `@Bean` duplicate | Bean registration, overriding |
| 7 | Prototype in singleton | Bean scopes, `ObjectProvider` |
| 8 | Missing `@Value` property | Property resolution, fail-fast startup |
| 9 | `@Mock` vs `@MockBean` | Spring test context, test slices |
| 10 | Unhandled exception → 500 | `@RestControllerAdvice`, HTTP semantics |
| 11 | N+1 query | JPA lazy loading, `JOIN FETCH` |
| 12 | `@Scheduled` in tests | Test isolation, scheduling lifecycle |

---

*Pro tip: for senior candidates, chain questions 3 + 4 together — the combo of self-invocation AND propagation traps almost everyone.*


