---
description: Deep codebase research before implementation. Read-only — no code changes until explicitly approved.
---

# Explore: Deep Codebase Research Before Implementation

This is a read-only research phase — no code changes until the human explicitly approves a plan.

## Core principles

1. **Document what IS, not what SHOULD BE.** You are a cartographer, not an architect. Map the territory first.
2. **Never take the first approach.** The first idea that comes to mind is almost always the naive one. Force yourself to find at least two more.
3. **Existing patterns are law until proven otherwise.** The codebase already has conventions. Find them. Follow them. Only deviate with explicit justification.
4. **Depth over speed.** Reading 10 files carefully beats skimming 50. Trace the actual code paths. Read the tests — they reveal intent that code comments never capture.
5. **Research errors compound exponentially.** A wrong assumption about how the codebase works leads to a wrong plan, which leads to hundreds of wrong lines of code. Get the research right.

## Research process

### Phase 1: Orient

Before reading any code, answer these questions:
- What exactly is the user trying to accomplish? (Restate it to confirm understanding)
- What area of the codebase is this likely to touch?
- What do I already know vs what do I need to discover?

### Phase 2: Map the territory

**Find the relevant code.** Use grep, file search, and directory listings. Don't stop at the first match — find ALL the places this concept lives.

**Read the actual code.** For each relevant file:
- Read it fully. Don't skim.
- Understand what it does, not just what it's called.
- Note the patterns: naming conventions, error handling style, how dependencies are injected, how tests are structured.

**Trace the data flow.** For the feature/area in question:
- Where does data enter the system?
- How does it transform as it moves through layers?
- Where does it exit?
- What are the integration points with other systems?

**Find prior art.** Search for similar features already implemented in the codebase:
- How was a comparable problem solved before?
- What abstractions exist that could be reused?
- What tests exist for similar functionality?
- Are there patterns (service objects, concerns, specific module structures) that this codebase consistently uses?

**Check the edges.** Look for:
- Feature flags controlling related behavior
- Configuration that affects this area
- Database schema and migrations relevant to this domain
- API contracts (GraphQL schemas, REST endpoints) that touch this area

### Phase 3: Document findings

Write a structured research document:

```markdown
## Research: [Topic]

### What I investigated
[Restate the goal and scope]

### How the system works today
[Describe the current implementation. File paths, key classes/modules, data flow.
Be specific — reference actual file paths and function names.]

### Existing patterns and conventions
[What patterns does this codebase use for similar problems?
Naming conventions, architectural patterns, testing approaches.
Reference concrete examples with file paths.]

### Key constraints and considerations
[Things that must be respected: existing API contracts, database schema,
performance requirements, feature flags, backwards compatibility.
Things that could go wrong. Edge cases.]

### Approaches

#### Approach A: [Name]
- **How it works:** [Concrete description]
- **Files to change:** [List]
- **Follows existing patterns:** [Yes/No — which ones]
- **Tradeoffs:** [Pros and cons]
- **Risk:** [What could go wrong]

#### Approach B: [Name]
[Same structure]

#### Approach C: [Name] (if applicable)
[Same structure]

### Recommendation
[Which approach and why. Ground it in what you found in the codebase,
not in abstract best practices.]

### Open questions
[Things you couldn't determine from the code alone.
Questions for the user before proceeding.]
```

### Phase 4: Stop and present

**Do not proceed to implementation.** Present the research document to the user. Wait for:
- Confirmation that the research is accurate
- Selection of an approach (or request for more research)
- Answers to open questions

Only after the user explicitly approves an approach should you begin planning the implementation.

## What NOT to do

- **Don't start writing code during research.** Not even "just a quick prototype." Research is read-only.
- **Don't propose one approach and ask "should I proceed?"** Always present multiple options with tradeoffs. The user makes the call.
- **Don't invent new patterns.** If the codebase uses service objects, use service objects. If it uses concerns, use concerns. Match what's there.
- **Don't assume you understand after reading one file.** Trace the full path. Read the tests. Check how it's called, not just how it's defined.
- **Don't skip the "prior art" search.** The single highest-leverage research activity is finding how the codebase already solves similar problems.
- **Don't present abstract pros/cons.** "This is more maintainable" means nothing. "This follows the pattern used in `app/services/checkout/` which the team already understands" means something.

## Adapting to scope

**Small tasks** (single file, clear fix): Abbreviate. Skim for patterns, confirm the approach, present briefly.

**Medium tasks** (multiple files, one area): Full research process. Find patterns, trace data flow, present 2-3 approaches.

**Large tasks** (cross-cutting, multiple systems): Multiple rounds of research. Map the full system first, then drill into each area. Consider writing the research to a file for persistence across sessions.

Now research: $@
