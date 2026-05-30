# Java Interview Questions — Anti-Cheat Edition
> Designed to test **genuine understanding**, not pattern matching. Each snippet produces a surprising or non-obvious output. Ask the candidate to explain *why* before running it.

---

## Ground Rules for the Interviewer
- Ask the candidate to **predict the output first**, then explain why.
- Follow up with *"What would you change to fix / alter the behaviour?"*
- If they copy-paste to AI, the answer alone won't save them — the *follow-up* will expose gaps.

## Difficulty Progression
- **Basics:** language fundamentals, equality, object lifecycle, collections
- **Intermediate:** generics, control flow edge cases, interface defaults, stream pitfalls
- **Advanced:** concurrency, memory model, API design contracts, Effective Java style trade-offs

---

## Basics

## 1. String Immutability

```java
public class Test1 {
    public static void main(String[] args) {
        String s = "Hello";
        s.concat(" World");
        System.out.println(s);
    }
}
```

**Output:** `Hello`

**Question:** Why doesn't it print `Hello World`?

**Key Points:**
- `String` is immutable; `concat()` returns a *new* `String` — the original reference `s` is unchanged.
- Fix: `s = s.concat(" World");`

**Follow-up:** What is the String pool / interning? How does `new String("Hello")` differ from `"Hello"`?

**Concepts:** String immutability, String pool / interning, reference vs value

---

## 2. String `==` vs `.equals()`

```java
public class Test2 {
    public static void main(String[] args) {
        String a = "Java";
        String b = "Java";
        String c = new String("Java");

        System.out.println(a == b);
        System.out.println(a == c);
        System.out.println(a.equals(c));
    }
}
```

**Output:**
```
true
false
true
```

**Question:** Why is `a == b` true but `a == c` false, even though all three contain `"Java"`?

**Key Points:**
- String literals are interned — `a` and `b` point to the same pool object.
- `new String(...)` always creates a new heap object, bypassing the pool.
- `==` compares references; `.equals()` compares content.

**Follow-up:** How do you force `c` into the pool? (`c.intern()`)

**Concepts:** String pool, reference equality, `intern()`

---

## 3. Overloading vs Overriding (Surprising Dispatch)

```java
class Parent {
    void show(Number n) { System.out.println("Parent Number"); }
}
class Child extends Parent {
    void show(Integer n) { System.out.println("Child Integer"); }
}
public class Test3 {
    public static void main(String[] args) {
        Parent p = new Child();
        p.show(10);
    }
}
```

**Output:** `Parent Number`

**Question:** The runtime object is a `Child`, so why does it print `Parent Number` instead of `Child Integer`?

**Key Points:**
- Method overloading is resolved at **compile time** based on the *declared* (static) type of the reference (`Parent`).
- `Parent` has no `show(Integer)` — only `show(Number)`. So the compiler binds to `show(Number)`.
- Dynamic dispatch (polymorphism) only applies to *overridden* methods (same signature).

**Follow-up:** What if `Child` instead overrode `show(Number n)`? What would print then?

**Concepts:** Static vs dynamic dispatch, overloading, overriding, compile-time binding

---

## 4. Autoboxing & Integer Cache

```java
public class Test4 {
    public static void main(String[] args) {
        Integer a = 127;
        Integer b = 127;
        Integer c = 128;
        Integer d = 128;

        System.out.println(a == b);
        System.out.println(c == d);
    }
}
```

**Output:**
```
true
false
```

**Question:** Both pairs are autoboxed from `int` literals — why does `==` give different results?

**Key Points:**
- JVM caches `Integer` objects for values **-128 to 127**. `a` and `b` share the cached instance.
- Values outside this range create new objects, so `c != d` by reference.
- Safe comparison always uses `.equals()` or unboxing.

**Follow-up:** What range is cached? Is this guaranteed by the JVM spec?

**Concepts:** Autoboxing, Integer cache, reference vs value equality

---

## 5. Generics & Invariance (Why `List<Integer>` isn't a `List<Number>`)

```java
import java.util.*;

public class Test5 {
    public static void main(String[] args) {
        Integer i = 10;
        Number iNum = i;                    // ✅ works — Integer IS-A Number

        List<Integer> ints = Arrays.asList(1, 2, 3);
        // List<Number> nums = ints;        // ❌ compile error
        List<? extends Number> nums2 = ints; // ✅ works
        System.out.println(nums2.get(0));
    }
}
```

**Output:** `1`

**Question:** Why does `List<Integer>` not assign to `List<Number>` even though `Integer extends Number`?

**Key Points:**
- Generics are **invariant** in Java. `List<Integer>` is NOT a subtype of `List<Number>`.
- If it were allowed, you could add a `Double` through a `List<Number>` reference, corrupting a `List<Integer>`.
- `? extends Number` is a **bounded wildcard** — read-only (no `add()`).

**Follow-up:** What does `? super Integer` allow? What is PECS (Producer Extends, Consumer Super)?

**Concepts:** Generics invariance, wildcards, PECS, type safety

---

## 6. `static` Initialiser & Constructor Order

```java
public class Test6 {
    static int x = initX();

    static int initX() {
        System.out.println("static init");
        return 5;
    }

    Test6() {
        System.out.println("constructor");
    }

    public static void main(String[] args) {
        System.out.println("main start");
        Test6 t1 = new Test6();
        Test6 t2 = new Test6();
    }
}
```

**Output:**
```
static init
main start
constructor
constructor
```

**Question:** Why does `static init` print before `main start`?

**Key Points:**
- Static initialisers run **once** when the class is first loaded by the JVM, before `main()` executes.
- Instance constructors run each time `new` is called.

**Follow-up:** What if `Test6` had a parent class with a static block? What runs first?

**Concepts:** Class loading, static vs instance initialisation, JVM lifecycle

---

## Intermediate

## 7. `finally` vs `return`

```java
public class Test7 {
    static int getValue() {
        try {
            return 1;
        } finally {
            return 2;
        }
    }

    public static void main(String[] args) {
        System.out.println(getValue());
    }
}
```

**Output:** `2`

**Question:** The `try` block explicitly returns `1`. Why does the method return `2`?

**Key Points:**
- `finally` **always** executes, even after a `return` in `try`.
- A `return` inside `finally` **overrides** the `return` in `try`.
- This is considered bad practice — it silently swallows the `try` return value.

**Follow-up:** What if `finally` threw an exception instead of returning? What happens to the original return value?

**Concepts:** `try-finally`, control flow, exception handling pitfalls

---

## 8. `==` on `null` and `instanceof`

```java
public class Test8 {
    public static void main(String[] args) {
        String s = null;
        System.out.println(s instanceof String);
        System.out.println(s == null);
        // s.equals("hello"); // what happens here?
    }
}
```

**Output:**
```
false
true
```

**Question:** `instanceof` returns `false` for `null` — is that a bug or by design?

**Key Points:**
- `null instanceof T` is **always false** by spec — `null` has no type.
- This is useful: `if (obj instanceof String)` is null-safe without a separate null check.
- `s.equals(...)` would throw `NullPointerException`.

**Follow-up:** How does Java 16+ pattern matching `instanceof` (`if (obj instanceof String str)`) change usage?

**Concepts:** `instanceof`, null safety, pattern matching (Java 16+)

---

## 9. Interface `default` Method Diamond Problem

```java
interface A {
    default String hello() { return "A"; }
}
interface B extends A {
    default String hello() { return "B"; }
}
class C implements A, B {
    // what must C do?
}
public class Test9 {
    public static void main(String[] args) {
        System.out.println(new C().hello());
    }
}
```

**Question:** Does this compile? If not, how do you fix it?

**Key Points:**
- This is a **compile error** — `C` inherits conflicting default methods from `A` and `B`.
- `C` **must** override `hello()` to resolve the ambiguity.
- Can delegate explicitly: `return B.super.hello();`

**Follow-up:** If `C` extends a class that also implements `hello()`, which wins — the class or the interface default?

**Concepts:** Default methods, diamond problem, interface vs class hierarchy

---

## 10. Varargs Ambiguity

```java
public class Test10 {
    static void print(int... nums) {
        System.out.println("varargs int");
    }
    static void print(Integer... nums) {
        System.out.println("varargs Integer");
    }

    public static void main(String[] args) {
        print(1, 2, 3);
    }
}
```

**Question:** Does this compile? If yes, which overload is called?

**Key Points:**
- This is a **compile error** — the compiler cannot choose between `int...` and `Integer...` when given `int` literals (autoboxing makes both equally valid).
- Varargs overloads with autoboxing candidates are ambiguous.

**Follow-up:** How would you resolve this? (Explicit cast: `print((int[]) new int[]{1,2,3})` or rename the methods.)

**Concepts:** Varargs, overload resolution, autoboxing ambiguity

---

## 11. `HashMap` and `null` Keys

```java
import java.util.*;

public class Test11 {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put(null, 1);
        map.put(null, 2);
        System.out.println(map.size());
        System.out.println(map.get(null));
    }
}
```

**Output:**
```
1
2
```

**Question:** Can a `HashMap` have `null` as a key? What happens when you insert it twice?

**Key Points:**
- `HashMap` allows **one** `null` key; the second `put` overwrites the first.
- `Hashtable` and `ConcurrentHashMap` do **not** allow `null` keys — throws `NullPointerException`.

**Follow-up:** How many `null` values can a `HashMap` have?

**Concepts:** `HashMap` internals, null handling, `Hashtable` vs `ConcurrentHashMap`

---

## 12. `volatile` vs `synchronized`

```java
public class Test12 {
    private static volatile boolean flag = false;

    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> {
            while (!flag) { /* spin */ }
            System.out.println("Thread saw flag = true");
        });
        t.start();
        Thread.sleep(100);
        flag = true;
    }
}
```

**Question:** What does `volatile` guarantee here? Would this work without `volatile`?

**Key Points:**
- `volatile` ensures **visibility** — writes are immediately flushed to main memory; reads always fetch from main memory.
- Without `volatile`, the JIT may cache `flag` in a CPU register — the thread might spin forever.
- `volatile` does **not** guarantee **atomicity** (e.g., `flag++` is still a race condition).

**Follow-up:** When would you need `synchronized` instead? What is the difference between `volatile` and `AtomicBoolean`?

**Concepts:** Java Memory Model, visibility, `volatile`, `synchronized`, atomicity

### Side-effect Trap: `parallelStream()` + shared mutable state

```java
List<String> words = getData(url);//Add more data
List<String> result = new ArrayList<>();//Shared Mutable Variable

words
    .parallelStream() //Gives problem 
    //.stream
    .map(String::toUpperCase)
    .forEach(name -> result.add(name));//Shared Mutability is BAD
```

**Why this is dangerous:** mutating shared state from a parallel stream introduces data races and inconsistent results.

**Safer approach:** collect into a new immutable result (`words.parallelStream().map(String::toUpperCase).toList()`).

---

## Quick Reference: Concepts Coverage

| # | Question Topic | Concepts |
|---|---------------|----------|
| 1 | String `concat` | Immutability, pool |
| 2 | String `==` vs `equals` | Pool, interning, reference equality |
| 3 | Overloading dispatch | Static vs dynamic binding |
| 4 | Integer cache | Autoboxing, JVM cache range |
| 5 | Generics invariance | Wildcards, PECS |
| 6 | Static init order | Class loading, JVM lifecycle |
| 7 | `finally` return | Control flow, exception pitfalls |
| 8 | `null instanceof` | Null safety, pattern matching |
| 9 | Default method diamond | Interface hierarchy |
| 10 | Varargs ambiguity | Overload resolution, autoboxing |
| 11 | `HashMap` null key | Map internals, null handling |
| 12 | `volatile` flag | Java Memory Model, visibility |

---

## Practice Pack (Basics to Intermediate)

### Essential Java — Interview Snippet Pack (Study Notes)

> **Purpose:** small, interview-style Java puzzles aligned to *Essential Java* / core Java topics: **exceptions, collections, lambdas, generics, streams, threads, regex, and file I/O**.
>
> **How to practice:** For each snippet, do 3 steps:
> 1) Predict output/behavior
> 2) Explain *why*
> 3) State the best-practice fix / what an interviewer wants to hear

---

## 1) Exceptions: `finally` overrides `return`
```java
public class Q1 {
  static int f() {
    try { return 1; }
    finally { return 2; }
  }
  public static void main(String[] args) {
    System.out.println(f());
  }
}
```
**Interview ask:** What prints and why?

✅ **Expected output:**
```
2
```
**Key point:** `finally` always runs; a `return` inside `finally` replaces any earlier `return`.

---

## 2) Try-with-resources: close order is **reverse**
```java
class R implements AutoCloseable {
  private final String name;
  R(String name) { this.name = name; }
  public void close() { System.out.print("close-" + name + " "); }
}

public class Q2 {
  public static void main(String[] args) {
    try (R a = new R("A"); R b = new R("B")) {
      System.out.print("try ");
    }
  }
}
```
**Interview ask:** What prints (order)?

✅ **Expected output:**
```
try close-B close-A 
```
**Key point:** Resources close in **reverse order of creation**.

---

## 3) Streams: laziness + short-circuit (`findFirst`)
```java
import java.util.*;

public class Q3 {
  public static void main(String[] args) {
    List<Integer> xs = Arrays.asList(1,2,3,4,5);
    int v = xs.stream()
      .filter(x -> { System.out.print("f" + x + " "); return x % 2 == 0; })
      .map(x -> { System.out.print("m" + x + " "); return x * 10; })
      .findFirst()
      .orElse(-1);

    System.out.println("=> " + v);
  }
}
```
**Interview ask:** How many elements are processed and why?

✅ **Typical output:**
```
f1 f2 m2 => 20
```
**Key point:** Streams are **lazy**; terminal op `findFirst()` **short-circuits** once it finds the first match.

---

## 4) Lambdas: “effectively final” capture
```java
import java.util.*;

public class Q4 {
  public static void main(String[] args) {
    int base = 10; // effectively final
    List<Integer> xs = List.of(1,2,3);

    xs.forEach(x -> System.out.println(x + base));

    // base++; // Uncomment -> compile error
  }
}
```
**Interview ask:** Why does `base++` cause a compile error?

**Key point:** A lambda can only capture local variables that are **final or effectively final**.

---

## 5) Generics: invariance + wildcard (`? extends Number`)
```java
import java.util.*;

public class Q5 {
  static double sum(List<? extends Number> xs) {
    double s = 0;
    for (Number n : xs) s += n.doubleValue();
    return s;
  }

  public static void main(String[] args) {
    List<Integer> a = List.of(1,2,3);
    System.out.println(sum(a));

    // List<Number> b = a; // compile error (invariance)
  }
}
```
**Interview ask:** Why does `List<Integer>` not assign to `List<Number>`?

**Key point:** Generics are **invariant**. Use `? extends Number` when you only need to **read**.

---

## 6) Maps: `computeIfAbsent` runs once per missing key
```java
import java.util.*;

public class Q6 {
  public static void main(String[] args) {
    Map<String, Integer> m = new HashMap<>();

    int a = m.computeIfAbsent("k", k -> {
      System.out.print("compute ");
      return 42;
    });

    int b = m.computeIfAbsent("k", k -> 99);

    System.out.println(a + " " + b + " " + m.get("k"));
  }
}
```
**Interview ask:** How many times does the lambda run?

✅ **Expected output:**
```
compute 42 42 42
```
**Key point:** Only computes when key is **absent**.

---

## 7) HashMap: mutating a key after `put()` breaks retrieval
```java
import java.util.*;

class Key {
  int id;
  Key(int id) { this.id = id; }

  @Override public int hashCode() { return id; }
  @Override public boolean equals(Object o) {
    return (o instanceof Key k) && k.id == id;
  }
}

public class Q7 {
  public static void main(String[] args) {
    Map<Key, String> map = new HashMap<>();
    Key k = new Key(1);
    map.put(k, "one");

    k.id = 2; // mutation breaks hashing

    System.out.println(map.get(k));
    System.out.println(map.size());
  }
}
```
**Interview ask:** Output and why is this dangerous?

✅ **Typical output:**
```
null
1
```
**Key point:** Hash-based collections assume keys have **stable `hashCode/equals`** while stored.

---

## 8) Threads: race condition (`count++` is not atomic)
```java
public class Q8 {
  static int count = 0;

  public static void main(String[] args) throws InterruptedException {
    Thread t1 = new Thread(() -> { for (int i=0;i<100_000;i++) count++; });
    Thread t2 = new Thread(() -> { for (int i=0;i<100_000;i++) count++; });

    t1.start(); t2.start();
    t1.join(); t2.join();

    System.out.println(count);
  }
}
```
**Interview ask:** Why isn’t it always `200000`? Fix?

**Key point:** `count++` is a read-modify-write sequence; updates get lost.

**Fix options:** `synchronized`, `AtomicInteger`, `LongAdder`, locks.

---

## 9) Threads: `run()` vs `start()`
```java
public class Q9 {
  public static void main(String[] args) {
    Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));

    t.run();   // runs on main thread
    t.start(); // runs on a new thread
  }
}
```
**Interview ask:** What’s the difference?

✅ **Typical output:**
```
main
Thread-0
```
**Key point:** `run()` is a normal method call; `start()` launches a new thread.

---

## 10) File I/O: chars vs bytes (encoding matters)
```java
import java.nio.charset.StandardCharsets;

public class Q10 {
  public static void main(String[] args) {
    String s = "€"; // one character

    System.out.println(s.length());
    System.out.println(s.getBytes(StandardCharsets.UTF_8).length);
  }
}
```
**Interview ask:** Why are these numbers different?

✅ **Typical output:**
```
1
3
```
**Key point:** `length()` counts UTF-16 code units; UTF‑8 encoding uses variable bytes.

---

## 11) Regex: capture groups
```java
import java.util.regex.*;

public class Q11 {
  public static void main(String[] args) {
    Matcher m = Pattern.compile("(\\w+)-(\\d+)").matcher("item-42");
    if (m.matches()) {
      System.out.println(m.group(1));
      System.out.println(m.group(2));
    }
  }
}
```
**Interview ask:** What is `group(0)`?

✅ **Expected output:**
```
item
42
```
**Key point:** `group(0)` is the entire match; groups start at 1.

---

## 12) Optional: `orElse` vs `orElseGet` (eager vs lazy)
```java
import java.util.*;

public class Q12 {
  static String expensive() {
    System.out.print("exp ");
    return "X";
  }

  public static void main(String[] args) {
    Optional<String> a = Optional.of("A");

    System.out.println(a.orElse(expensive()));       // eager
    System.out.println(a.orElseGet(Q12::expensive)); // lazy
  }
}
```
**Interview ask:** Which evaluates lazily and why?

**Key point:** `orElse()` evaluates its argument **even if** Optional is present; `orElseGet()` only calls supplier when empty.

---

# Extra practice prompts (no code)
- Explain the **difference between checked and unchecked exceptions**.
- Explain the **contract** between `equals()` and `hashCode()`.
- When would you prefer `ConcurrentHashMap` over `Collections.synchronizedMap`?
- Difference between `ArrayList` and `LinkedList` in real workloads.

---

## Suggested daily routine
- **Day 1–2:** Exceptions + Collections
- **Day 3–4:** Streams + Lambdas + Optional
- **Day 5:** Threads + concurrency pitfalls
- Repeat with your own variations.

## Advanced

### Effective Java — Interview Snippet Pack (Study Notes)

> **Purpose:** quick, interview-style code puzzles based on the *principles* popularized in **Effective Java (3rd ed.)**.
> 
> **Note:** This is **not** a copy of the book. It’s an original practice pack.

## How to use this pack
- For each snippet: **predict the output**, then explain **why**, then propose the **Effective Java–style fix**.
- Practice answering in **60–90 seconds** per question.

---

## 1) Prefer static factories to constructors (naming + caching)
```java
final class Score {
  private static final Score ZERO = new Score(0);
  private final int value;
  private Score(int value) { this.value = value; }

  public static Score of(int value) {
    return value == 0 ? ZERO : new Score(value);
  }
}
```
**Ask:** What benefits does `of()` enable that a constructor can’t easily?
- Named creation, caching, returning subtypes, hiding implementation.

---

## 2) Builder when many params (avoid telescoping)
```java
public final class User {
  private final String id;
  private final String email;
  private final String phone;

  private User(Builder b) {
    this.id = b.id;
    this.email = b.email;
    this.phone = b.phone;
  }

  public static class Builder {
    private final String id;
    private String email;
    private String phone;

    public Builder(String id) { this.id = id; }
    public Builder email(String email) { this.email = email; return this; }
    public Builder phone(String phone) { this.phone = phone; return this; }
    public User build() { return new User(this); }
  }
}

// usage:
// User u = new User.Builder("u1").email("a@b.com").build();
```
**Ask:** What problems does builder solve vs telescoping constructors / JavaBeans?

---

## 3) Enums for singletons (safe serialization / reflection)
```java
public enum Config {
  INSTANCE;
  public String region() { return "us-west"; }
}
```
**Ask:** Why is this preferred over `public static final Config INSTANCE = new Config()`?

---

## 4) Don’t use `finalize()` / cleaners for critical resources
```java
class Leaky {
  @Override protected void finalize() throws Throwable {
    System.out.println("finalize");
  }
}
```
**Ask:** Why is relying on finalization unsafe? What do you use instead?

---

## 5) Prefer try-with-resources
```java
import java.io.*;

public class Q5 {
  public static void main(String[] args) throws Exception {
    try (ByteArrayInputStream in = new ByteArrayInputStream(new byte[]{1,2,3})) {
      System.out.println(in.read());
    }
  }
}
```
**Ask:** What happens if `close()` throws and the body throws too? (suppressed exceptions)

---

## 6) equals() pitfalls: symmetry with inheritance
```java
class Point {
  final int x, y;
  Point(int x, int y) { this.x = x; this.y = y; }

  @Override public boolean equals(Object o) {
    if (!(o instanceof Point p)) return false;
    return x == p.x && y == p.y;
  }
}

class ColoredPoint extends Point {
  final String color;
  ColoredPoint(int x,int y,String c){ super(x,y); color=c; }

  // naive equals:
  @Override public boolean equals(Object o) {
    if (!(o instanceof ColoredPoint cp)) return false;
    return super.equals(cp) && color.equals(cp.color);
  }
}

public class Q6 {
  public static void main(String[] args) {
    Point p = new Point(1,2);
    Point cp = new ColoredPoint(1,2,"red");
    System.out.println(p.equals(cp));
    System.out.println(cp.equals(p));
  }
}
```
**Ask:** What prints? Which part of the equals contract is violated?
**Expected:** `true` then `false` (symmetry violation).
**Fix:** favor composition, or make `Point` final, or use a well-defined equality strategy.

---

## 7) Always override hashCode when overriding equals
```java
import java.util.*;

final class Money {
  final int amount;
  final String currency;
  Money(int a, String c){ amount=a; currency=c; }

  @Override public boolean equals(Object o){
    return (o instanceof Money m)
      && amount == m.amount
      && Objects.equals(currency, m.currency);
  }
  // hashCode intentionally omitted
}

public class Q7 {
  public static void main(String[] args) {
    Set<Money> s = new HashSet<>();
    s.add(new Money(5,"USD"));
    System.out.println(s.contains(new Money(5,"USD")));
  }
}
```
**Ask:** Why can this print `false`? What’s the fix?

---

## 8) toString() as a debugging API
```java
record OrderId(String value) {}

public class Q8 {
  public static void main(String[] args) {
    System.out.println(new OrderId("o-123"));
  }
}
```
**Ask:** Why are records nice for value types (equals/hashCode/toString provided)?

---

## 9) Comparable: be consistent with equals
```java
import java.util.*;

final class Person implements Comparable<Person> {
  final String name;
  final int age;
  Person(String n, int a){ name=n; age=a; }

  @Override public int compareTo(Person o) {
    return name.compareTo(o.name); // age ignored
  }

  @Override public boolean equals(Object o){
    return (o instanceof Person p) && age==p.age && name.equals(p.name);
  }
}

public class Q9 {
  public static void main(String[] args) {
    Set<Person> set = new TreeSet<>();
    set.add(new Person("A", 20));
    set.add(new Person("A", 30));
    System.out.println(set.size());
  }
}
```
**Ask:** Why is the size `1`? What rule is being broken?

---

## 10) Minimize mutability
```java
import java.util.*;

final class Bag {
  private final List<String> items;
  Bag(List<String> items) {
    this.items = items; // BUG
  }
  List<String> items(){ return items; }
}

public class Q10 {
  public static void main(String[] args) {
    var src = new ArrayList<>(List.of("a"));
    var b = new Bag(src);
    src.add("b");
    System.out.println(b.items());
  }
}
```
**Ask:** Output? How do you make `Bag` truly immutable?
**Fix:** defensive copy + unmodifiable view.

---

## 11) Favor composition over inheritance
```java
import java.util.*;

class InstrumentedHashSet<E> extends HashSet<E> {
  private int addCount = 0;
  @Override public boolean add(E e){ addCount++; return super.add(e); }
  @Override public boolean addAll(Collection<? extends E> c){
    addCount += c.size();
    return super.addAll(c);
  }
  int getAddCount(){ return addCount; }
}

public class Q11 {
  public static void main(String[] args) {
    var s = new InstrumentedHashSet<String>();
    s.addAll(List.of("a","b","c"));
    System.out.println(s.getAddCount());
  }
}
```
**Ask:** Why can this print `6`? How does composition fix it?

---

## 12) Generic varargs + heap pollution
```java
import java.util.*;

public class Q12 {
  static <T> List<T> flatten(List<T>... lists) {
    List<T> out = new ArrayList<>();
    for (var l : lists) out.addAll(l);
    return out;
  }

  public static void main(String[] args) {
    List<String> a = List.of("x");
    List<String> b = List.of("y");
    System.out.println(flatten(a,b));
  }
}
```
**Ask:** Why might the compiler warn here? When is `@SafeVarargs` appropriate?

---

## 13) Prefer interfaces to reflection
```java
public class Q13 {
  public static void main(String[] args) throws Exception {
    Object x = Class.forName("java.lang.String").getConstructor(String.class)
                    .newInstance("hi");
    System.out.println(((String)x).toUpperCase());
  }
}
```
**Ask:** What are the downsides of reflection (safety, performance, readability)?

---

## 14) Streams: keep them side-effect free
```java
import java.util.*;

public class Q14 {
  public static void main(String[] args) {
    List<Integer> xs = List.of(1,2,3,4);
    int[] sum = {0};

    xs.stream().map(x -> sum[0] += x).forEach(System.out::println);
    System.out.println("sum=" + sum[0]);
  }
}
```
**Ask:** Why is this an anti-pattern? What’s the functional alternative?
**Better:** `int s = xs.stream().mapToInt(Integer::intValue).sum();`

---

## 15) Exceptions only for exceptional conditions
```java
public class Q15 {
  static int indexOf(int[] a, int target) {
    try {
      for (int i = 0;; i++) if (a[i] == target) return i;
    } catch (ArrayIndexOutOfBoundsException e) {
      return -1;
    }
  }
}
```
**Ask:** Why is using exceptions for normal control flow bad?

---

## 16) Concurrency: prefer executors to raw threads
```java
import java.util.concurrent.*;

public class Q16 {
  public static void main(String[] args) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(2);
    Future<Integer> f = pool.submit(() -> 40 + 2);
    System.out.println(f.get());
    pool.shutdown();
  }
}
```
**Ask:** Why are executors the preferred abstraction? What about graceful shutdown?

---

## 17) Concurrency: publication + visibility
```java
public class Q17 {
  static boolean ready;
  static int number;

  public static void main(String[] args) {
    new Thread(() -> {
      while (!ready) { /* spin */ }
      System.out.println(number);
    }).start();

    number = 42;
    ready = true;
  }
}
```
**Ask:** Why can this **hang** or print `0`? How to fix?
**Fix:** `volatile`, `synchronized`, or higher-level concurrency constructs.

---

## 18) Serialization: prefer alternatives
```java
// Interview prompt (no code):
// Explain why Java native serialization is risky and what you use instead.
```
**Good answers:** JSON/Protobuf/Avro + explicit schemas; or custom externalization when needed.

---

## Mini-checklist (what interviewers listen for)
- You mention **contracts** (equals/hashCode/compareTo), **immutability**, **encapsulation**, **composition**, **generics safety**, and **concurrency visibility**.
- You propose fixes that improve **readability, correctness, and maintainability**.

## Suggested practice routine
1. Pick 5 snippets/day.
2. Explain **the bug**, **the principle**, **the fix**, **the tradeoff**.
3. Re-implement the fix from memory.

---

## References (for further reading)
- Effective Java (Joshua Bloch), 3rd edition.
- Oracle JavaDocs: `Object.equals`, `Object.hashCode`, `AutoCloseable`.

--8<-- "_abbreviations.md"


