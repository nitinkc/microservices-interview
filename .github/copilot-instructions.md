# Copilot Instructions — Microservices Interview Guide

# MkDocs Documentation Guide

This guide documents the configuration, best practices, and known solutions for this project. It follows the standardized MkDocs Material theme pattern.

---

## PART 1: PROJECT STRUCTURE

```
microservicesInterview/
├── mkdocs.yml                                      ← Site config and nav
├── requirements.txt                                ← Python deps
├── docs/
│   ├── index.md                                    ← Overview + topic map
│   ├── glossary.md                                 ← Full glossary page
│   ├── _abbreviations.md                           ← Hover tooltip definitions (abbr syntax)
│   ├── snippets/
│   │   └── glossary.md                             ← Legacy redirect (kept for reference)
│   ├── css/
│   │   └── extra.css                               ← Custom styles
│   ├── js/
│   │   ├── mathjax.js                              ← MathJax config (must load BEFORE CDN library)
│   │   ├── mermaid-init.js                         ← Mermaid init (converts code blocks to divs)
│   │   ├── abbr-tooltip.js                         ← Abbreviation tooltip support
│   │   └── theme-toggle.js                         ← Dark/light theme persistence
│   └── interview/
│       ├── 01-microservices-resilience.md          ← Resilience & fault tolerance
│       ├── 02-service-communication.md             ← Inter-service communication (planned)
│       ├── 03-performance-scalability.md           ← Performance & scalability (planned)
│       ├── 04-data-consistency.md                  ← Data consistency & idempotency (planned)
│       ├── 05-observability.md                     ← Observability & debugging (planned)
│       ├── 06-deployment-compatibility.md          ← Deployment & versioning (planned)
│       └── 07-advanced-patterns.md                 ← Advanced patterns (planned)
├── site/                                           ← Generated output (do not edit)
└── .venv/                                          ← Python virtual env
```

### Essential Dependencies (`requirements.txt`)

```
mkdocs>=1.5.0
mkdocs-material>=9.5.0
pymdown-extensions>=10.8
Markdown>=3.6
```

---

## PART 2: MKDOCS CONFIGURATION

### Theme

This project uses the **Material theme** with light/dark palette toggle. User preference is persisted by `docs/js/theme-toggle.js`.

```yaml
theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/weather-night
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/weather-sunny
        name: Switch to light mode
```

### JavaScript Load Order (Critical)

```yaml
extra_javascript:
  - https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
  - https://unpkg.com/mermaid@10/dist/mermaid.js
  - js/mermaid-init.js
  - js/mathjax.js                                                   # Config FIRST
  - https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js    # Library SECOND
  - js/theme-toggle.js
  - js/abbr-tooltip.js
```

### CSS

```yaml
extra_css:
  - css/extra.css
```

### Markdown Extensions

```yaml
markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets          # enables --8<-- inclusion
  - pymdownx.tabbed:
      alternate_style: true
  - attr_list
  - md_in_html
  - tables
  - footnotes
  - def_list
  - abbr
  - pymdownx.arithmatex:
      generic: true
```

---

## PART 3: KNOWN ISSUES & SOLUTIONS

### Issue 1: Markdown Lists Not Rendering

**Problem:** Lists appear as plain text.

**Root Cause:** Markdown requires a blank line between body text and list items.

```markdown
✅ CORRECT:
Some text

- List item 1
- List item 2
```

---

### Issue 2: Mermaid Diagrams Not Rendering

**Problem:** Mermaid code blocks appear as highlighted code instead of rendered diagrams.

**Root Cause:** Use client-side JS to convert code blocks to mermaid divs.

`docs/js/mermaid-init.js` key logic:

```javascript
if (text.startsWith('graph ') || text.includes('graph LR')) {
  const mermaidDiv = document.createElement('div');
  mermaidDiv.className = 'mermaid';
  mermaidDiv.textContent = text;
  highlightDiv.replaceWith(mermaidDiv);
}
```

**Never use `|` in Mermaid node labels — use `·` instead.**

---

### Issue 3: Math Equations Not Rendering

**Problem:** LaTeX code is shown as plain text.

**Root Cause:** `js/mathjax.js` config must load BEFORE the CDN library. See JS load order above.

---

### Issue 4: Collapsible Interview Questions

This project uses PyMdown `??? question` admonitions:

```markdown
??? question "What is a circuit breaker?"
    Answer in 2–4 lines.
```

Requires `pymdownx.details` and `admonition` in `markdown_extensions`. Styling via `docs/css/extra.css`.

---

### Issue 5: Glossary / Abbreviations Not Rendering

**Problem:** Hover tooltips not appearing on terms.

**Solution:**

1. Terms are defined in `docs/_abbreviations.md` using abbr syntax:

```markdown
*[API]: Application Programming Interface
*[gRPC]: Google Remote Procedure Call
```

2. Every article must include at the bottom:

```markdown
--8<-- "_abbreviations.md"
```

3. `mkdocs.yml` must have both:

```yaml
markdown_extensions:
  - abbr
  - pymdownx.snippets
```

4. CSS in `docs/css/extra.css`:

```css
abbr {
  cursor: help;
  text-decoration: underline dotted #0077cc;
}
```

---

## PART 4: NAV STRUCTURE (`mkdocs.yml`)

| Nav Section | File | Topics |
|---|---|---|
| Home | `index.md` | Overview + topic map |
| Resilience & Fault Tolerance | `interview/01-microservices-resilience.md` | Circuit breakers, bulkheads, fallbacks |
| Service Communication | `interview/02-service-communication.md` | Retries, idempotency, gRPC |
| Performance & Scalability | `interview/03-performance-scalability.md` | Latency, auto-scaling, load balancing |
| Data Consistency | `interview/04-data-consistency.md` | Saga, idempotency, event dedup |
| Observability & Debugging | `interview/05-observability.md` | Tracing, logging, metrics |
| Deployment & Compatibility | `interview/06-deployment-compatibility.md` | Versioning, canary, feature flags |
| Advanced Patterns | `interview/07-advanced-patterns.md` | Async APIs, CQRS, event sourcing |
| Glossary | `glossary.md` | All terms |

---

## PART 5: CONTENT MODEL & ADDING NEW CONTENT

Articles live in `docs/interview/` and are numbered `NN-topic-name.md`.

- **Each file** covers one topic area (e.g., Resilience, Communication, Observability).
- **Each file** contains multiple `??? question` blocks — one per interview question.
- Never remove existing questions. Only add new ones.

### New topic file
1. Create `docs/interview/NN-topic-name.md`.
2. Add entry to the matching nav group in `mkdocs.yml`.

### New question in an existing file
1. Open the relevant `docs/interview/NN-topic.md`.
2. Add a new `??? question "..."` block in the appropriate section.

---

## PART 6: ARTICLE TEMPLATE

```markdown
# Topic Name — Microservices Interview

> **Level:** Intermediate · Advanced
> **Section:** [Topic Area](../interview/NN-topic.md)

---

## Section Heading

Brief intro to this group of questions.

??? question "Interview question one?"
    Answer in 2–4 lines.

??? question "Interview question two?"
    Answer in 2–4 lines.

??? question "Interview question three?"
    Answer in 2–4 lines.

---

## Diagram

```mermaid
graph LR
    A[Service A] --> B[Service B · fallback]
` `` `

--8<-- "_abbreviations.md"
` ``

---

## PART 7: STYLE RULES

- Every file is a set of collapsible `??? question` blocks grouped by theme.
- Use `## Section Heading` to group related questions within a file.
- Every file should include at least one Mermaid architecture diagram.
- End every file with `--8<-- "_abbreviations.md"`.
- Always leave a blank line before lists.
- Never use `|` in Mermaid node labels — use `·` instead.
- Navigation: link between related topic files where relevant.
- Answers should be 2–5 lines — concise, interview-ready.

---

## PART 8: BUILD & DEPLOYMENT

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m mkdocs serve   # → http://127.0.0.1:8000
python3 -m mkdocs build   # output in site/
```

Always run `mkdocs build` to catch errors before committing.
